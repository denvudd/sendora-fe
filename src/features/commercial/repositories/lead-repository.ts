import { checkFeatureAllowed } from '@features/commercial/lib/feature-limits'
import { type LeadStatus, type Prisma } from '@prisma/client'
import { prisma } from '@shared/utils/prisma'

import { PLAN_FEATURE_CODE } from '@/shared/constants/plan-feature-code'

interface CreateLeadParams {
  workspaceId: string
  email: string
  firstName?: string
  lastName?: string
  metadata?: Prisma.InputJsonValue
  notes?: string
  phone?: string
  source?: string
}

interface ListLeadsByWorkspaceParams {
  workspaceId: string
  limit?: number
}

interface UpdateLeadStatusParams {
  workspaceId: string
  leadId: string
  status: LeadStatus
}

export async function createLead({
  workspaceId,
  email,
  firstName,
  lastName,
  metadata,
  notes,
  phone,
  source,
}: CreateLeadParams) {
  const currentCount = await prisma.lead.count({ where: { workspaceId } })
  const check = await checkFeatureAllowed({
    workspaceId,
    featureCode: PLAN_FEATURE_CODE.MAX_CONTACTS,
    currentCount,
  })

  if (!check.allowed) {
    throw new Error(
      `Contact limit reached. Your plan allows up to ${check.limit} contact${check.limit === 1 ? '' : 's'}.`,
    )
  }

  return prisma.lead.create({
    data: {
      workspaceId,
      email,
      firstName,
      lastName,
      metadata,
      notes,
      phone,
      source,
    },
  })
}

export async function listLeadsByWorkspace({
  workspaceId,
  limit = 50,
}: ListLeadsByWorkspaceParams) {
  return prisma.lead.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    where: {
      workspaceId,
    },
  })
}

interface UpsertLeadParams {
  workspaceId: string
  email: string
  firstName?: string
  lastName?: string
}

export async function upsertLead({
  workspaceId,
  email,
  firstName,
  lastName,
}: UpsertLeadParams) {
  const existing = await prisma.lead.findUnique({
    where: { workspaceId_email: { workspaceId, email } },
  })

  if (existing) {
    return prisma.lead.update({
      where: { workspaceId_email: { workspaceId, email } },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      },
    })
  }

  return createLead({
    workspaceId,
    email,
    firstName,
    lastName,
    source: 'chatbot',
  })
}

export async function updateLeadStatus({
  workspaceId,
  leadId,
  status,
}: UpdateLeadStatusParams) {
  return prisma.lead.update({
    data: {
      status,
    },
    where: {
      id: leadId,
      workspaceId,
    },
  })
}
