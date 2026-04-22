import {
  findActiveSubscriptionByWorkspaceId,
  findWorkspaceById,
  updateLeadHubSpotSync,
  updateWorkspaceHubSpotTokens,
} from '@features/commercial/repositories'
import { type LeadStatus } from '@prisma/client'

import { PLAN_CODE } from '@/shared/constants/plan-code'

import {
  getHubSpotAccessToken,
  HUBSPOT_LEAD_STATUS_PROPERTY_NAME,
  updateHubSpotContactProperty,
  upsertHubSpotContact,
} from './hubspot'

interface SyncLeadToHubSpotParams {
  workspaceId: string
  leadId: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  hubspotContactId?: string | null
  leadStatus?: LeadStatus
  isStatusOnlyUpdate?: boolean
}

export async function syncLeadToHubSpot({
  workspaceId,
  leadId,
  email,
  firstName,
  lastName,
  phone,
  hubspotContactId,
  leadStatus,
  isStatusOnlyUpdate,
}: SyncLeadToHubSpotParams): Promise<void> {
  const workspace = await findWorkspaceById({ workspaceId })

  if (!workspace?.hubspotEnabled || !workspace.hubspotRefreshToken) {
    return
  }

  const subscription = await findActiveSubscriptionByWorkspaceId({
    workspaceId,
  })
  const planCode = subscription?.plan.code ?? PLAN_CODE.STANDARD

  if (planCode === PLAN_CODE.STANDARD) {
    return
  }

  let accessToken: string

  try {
    accessToken = await getHubSpotAccessToken(workspace.hubspotRefreshToken)
  } catch (err) {
    const isRevoked = err instanceof Error && err.message.includes('401')
    console.error('[syncLeadToHubSpot] Token refresh failed:', err)

    if (isRevoked) {
      await updateWorkspaceHubSpotTokens({
        workspaceId,
        refreshToken: null,
        enabled: false,
      })
    }

    return
  }

  try {
    const syncedAt = new Date()

    if (isStatusOnlyUpdate) {
      if (!hubspotContactId || !leadStatus) {
        return
      }

      await updateHubSpotContactProperty({
        accessToken,
        contactId: hubspotContactId,
        property: HUBSPOT_LEAD_STATUS_PROPERTY_NAME,
        value: leadStatus,
      })
      await updateLeadHubSpotSync({ workspaceId, leadId, syncedAt })
    } else {
      const returnedContactId = await upsertHubSpotContact({
        accessToken,
        email,
        firstName,
        lastName,
        phone,
        sendoraLeadStatus: leadStatus,
      })

      await updateLeadHubSpotSync({
        workspaceId,
        leadId,
        hubspotContactId: returnedContactId,
        syncedAt,
      })
    }
  } catch (err) {
    console.error('[syncLeadToHubSpot] Sync failed:', err)
  }
}
