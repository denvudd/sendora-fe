'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateLeadNotes,
} from '@features/commercial/repositories'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface UpdateLeadNotesResult {
  success: boolean
  message?: string
}

export async function updateLeadNotesAction(
  leadId: string,
  notes: string,
): Promise<UpdateLeadNotesResult> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect(ROUTES.SignIn)
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect(ROUTES.SignIn)
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  try {
    await updateLeadNotes({ workspaceId: workspace.id, leadId, notes })

    return { success: true }
  } catch {
    return { success: false, message: 'Failed to update notes.' }
  }
}
