'use server'

import { auth } from '@clerk/nextjs/server'
import {
  addMessage,
  findUserByClerkId,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import {
  pusherServer,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from '@shared/lib/pusher'
import { prisma } from '@shared/utils/prisma'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface SendOperatorMessageState {
  message?: string
  success?: boolean
}

export async function sendOperatorMessageAction(
  sessionId: string,
  content: string,
): Promise<SendOperatorMessageState> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect(ROUTES.SignIn)
  }

  const dbUser = await findUserByClerkId({ clerkId })

  if (!dbUser) {
    redirect(ROUTES.SignIn)
  }

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  if (!content.trim()) {
    return { message: 'Message cannot be empty.' }
  }

  // Verify session belongs to this workspace and is in HUMAN mode
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      status: 'HUMAN',
      chatbot: { domain: { workspaceId: workspace.id } },
    },
    select: { id: true, sessionUuid: true },
  })

  if (!session) {
    return { message: 'Session not found or not in realtime mode.' }
  }

  try {
    const saved = await addMessage({
      sessionId: session.id,
      role: 'assistant',
      content: content.trim(),
    })

    await Promise.all([
      // Notify widget (customer sees the operator message)
      pusherServer.trigger(
        PUSHER_CHANNELS.chatSession(session.sessionUuid),
        PUSHER_EVENTS.OPERATOR_MESSAGE,
        {
          id: saved.id,
          content: content.trim(),
          createdAt: saved.createdAt.toISOString(),
        },
      ),
      // Update dashboard session list preview
      pusherServer.trigger(
        PUSHER_CHANNELS.workspace(workspace.id),
        PUSHER_EVENTS.SESSION_UPDATED,
        {
          sessionId: session.id,
          lastMessage: content.trim(),
          status: 'HUMAN',
        },
      ),
    ])

    return { success: true }
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }
}
