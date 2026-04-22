'use server'

import type { LeadStatus } from '@prisma/client'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateLeadStatus,
} from '@features/commercial/repositories'
import { syncLeadToHubSpot } from '@features/workspace-settings/lib/sync-lead-to-hubspot'
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
    const lead = await updateLeadStatus({
      workspaceId: workspace.id,
      leadId,
      status,
    })

    void syncLeadToHubSpot({
      workspaceId: workspace.id,
      leadId: lead.id,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      hubspotContactId: lead.hubspotContactId,
      leadStatus: status,
      isStatusOnlyUpdate: !!lead.hubspotContactId,
    })

    return { success: true }
  } catch {
    return { success: false, message: 'Failed to update lead status.' }
  }
}
