import type { NextRequest } from 'next/server'

import { auth } from '@clerk/nextjs/server'
import {
  findUserByClerkId,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { pusherServer } from '@shared/lib/pusher'
import { prisma } from '@shared/utils/prisma'

export async function POST(request: NextRequest): Promise<Response> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const socketId = formData.get('socket_id') as string
  const channelName = formData.get('channel_name') as string

  if (!socketId || !channelName) {
    return Response.json(
      { error: 'Missing socket_id or channel_name' },
      { status: 400 },
    )
  }

  const dbUser = await findUserByClerkId({ clerkId })

  if (!dbUser) {
    return Response.json({ error: 'User not found' }, { status: 401 })
  }

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    return Response.json({ error: 'Workspace not found' }, { status: 401 })
  }

  // Validate the requested channel belongs to this workspace
  if (channelName === `private-workspace-${workspace.id}`) {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName)

    return Response.json(authResponse)
  }

  // For private-session-{sessionId} channels, verify session belongs to workspace
  const sessionMatch = channelName.match(/^private-session-(.+)$/)

  if (sessionMatch) {
    const sessionId = sessionMatch[1]

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        chatbot: { domain: { workspaceId: workspace.id } },
      },
      select: { id: true },
    })

    if (!session) {
      return Response.json(
        { error: 'Session not found or access denied' },
        { status: 403 },
      )
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName)

    return Response.json(authResponse)
  }

  return Response.json({ error: 'Channel not allowed' }, { status: 403 })
}
