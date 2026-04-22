'use server'

import { auth } from '@clerk/nextjs/server'
import {
  closeSession,
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

interface CloseSessionState {
  message?: string
  success?: boolean
}

export async function closeSessionAction(
  sessionId: string,
): Promise<CloseSessionState> {
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

  const existing = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      chatbot: { domain: { workspaceId: workspace.id } },
    },
    select: { id: true, status: true, sessionUuid: true },
  })

  if (!existing) {
    return { message: 'Session not found.' }
  }

  if (existing.status === 'CLOSED') {
    return { success: true }
  }

  try {
    const updated = await closeSession({ sessionId })

    await Promise.all([
      // Notify the widget — customer sees session is closed
      pusherServer.trigger(
        PUSHER_CHANNELS.chatSession(updated.sessionUuid),
        PUSHER_EVENTS.SESSION_CLOSED,
        {},
      ),
      // Update the session list in the dashboard
      pusherServer.trigger(
        PUSHER_CHANNELS.workspace(workspace.id),
        PUSHER_EVENTS.SESSION_UPDATED,
        {
          sessionId: updated.id,
          lastMessage: '',
          status: 'CLOSED',
        },
      ),
    ])

    return { success: true }
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }
}
