'use server'

import { auth } from '@clerk/nextjs/server'
import {
  addMessage,
  findUserByClerkId,
  findWorkspaceByUserId,
  generatePortalToken,
} from '@features/commercial/repositories'
import {
  pusherServer,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from '@shared/lib/pusher'
import { prisma } from '@shared/utils/prisma'
import { redirect } from 'next/navigation'

import { portalPage, ROUTES } from '@/shared/constants/routes'

interface SendPortalLinkMessageState {
  message?: string
  success?: boolean
  portalUrl?: string
}

export async function sendPortalLinkMessageAction(
  sessionId: string,
): Promise<SendPortalLinkMessageState> {
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

  // Verify session belongs to this workspace and is in HUMAN mode
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      status: 'HUMAN',
      chatbot: { domain: { workspaceId: workspace.id } },
    },
    select: { id: true, sessionUuid: true, portalToken: true },
  })

  if (!session) {
    return { message: 'Session not found or not in realtime mode.' }
  }

  try {
    // If portal token already exists, use it; otherwise generate a new one
    const token =
      session.portalToken ??
      (await generatePortalToken({ sessionId })).portalToken

    if (!token) {
      return { message: 'Failed to generate portal link.' }
    }

    const portalUrl = portalPage(token)
    const messageContent = `I've prepared a booking link for you. Click here to schedule your appointment: ${process.env.NEXT_PUBLIC_APP_URL}${portalUrl}`

    const saved = await addMessage({
      sessionId: session.id,
      role: 'assistant',
      content: messageContent,
    })

    await Promise.all([
      // Notify widget (customer sees the portal link message)
      pusherServer.trigger(
        PUSHER_CHANNELS.chatSession(session.sessionUuid),
        PUSHER_EVENTS.OPERATOR_MESSAGE,
        {
          id: saved.id,
          content: messageContent,
          createdAt: saved.createdAt.toISOString(),
        },
      ),
      // Update dashboard session list preview
      pusherServer.trigger(
        PUSHER_CHANNELS.workspace(workspace.id),
        PUSHER_EVENTS.SESSION_UPDATED,
        {
          sessionId: session.id,
          lastMessage: messageContent,
          status: 'HUMAN',
        },
      ),
    ])

    return { success: true, portalUrl }
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }
}
