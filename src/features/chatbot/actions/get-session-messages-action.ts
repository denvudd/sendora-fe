'use server'

import { auth } from '@clerk/nextjs/server'
import {
  findSessionWithMessages,
  findUserByClerkId,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

export async function getSessionMessagesAction(sessionId: string) {
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

  const session = await findSessionWithMessages({
    sessionId,
    workspaceId: workspace.id,
  })

  return session
}
