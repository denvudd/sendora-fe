'use server'

import type { LeadStatus } from '@prisma/client'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateLeadStatus,
} from '@features/commercial/repositories'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface UpdateLeadStatusResult {
  success: boolean
  message?: string
}

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<UpdateLeadStatusResult> {
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
    await updateLeadStatus({ workspaceId: workspace.id, leadId, status })

    return { success: true }
  } catch {
    return { success: false, message: 'Failed to update lead status.' }
  }
}
