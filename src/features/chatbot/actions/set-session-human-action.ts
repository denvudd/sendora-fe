'use server'

import { auth } from '@clerk/nextjs/server'
import {
  findUserByClerkId,
  findWorkspaceByUserId,
  setSessionHumanBySessionId,
} from '@features/commercial/repositories'
import {
  pusherServer,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from '@shared/lib/pusher'
import { prisma } from '@shared/utils/prisma'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface SetSessionHumanState {
  message?: string
  success?: boolean
}

export async function setSessionHumanAction(
  sessionId: string,
): Promise<SetSessionHumanState> {
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

  // Verify session belongs to this workspace
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

  if (existing.status === 'HUMAN') {
    return { success: true }
  }

  try {
    const updated = await setSessionHumanBySessionId({ sessionId })

    await Promise.all([
      // Notify the widget (public channel)
      pusherServer.trigger(
        PUSHER_CHANNELS.chatSession(updated.sessionUuid),
        PUSHER_EVENTS.STATUS_CHANGED,
        { status: 'HUMAN' },
      ),
      // Notify dashboard of manual escalation
      pusherServer.trigger(
        PUSHER_CHANNELS.workspace(workspace.id),
        PUSHER_EVENTS.SESSION_ESCALATED,
        {
          sessionId: updated.id,
          sessionUuid: updated.sessionUuid,
          domainHostname: updated.chatbot.domain.hostname,
        },
      ),
    ])

    return { success: true }
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }
}
