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

interface ListLeadsWithFiltersParams {
  workspaceId: string
  domainId?: string
  status?: LeadStatus
  dateFrom?: Date
  dateTo?: Date
  limit?: number
}

interface FindLeadByIdParams {
  workspaceId: string
  leadId: string
}

interface UpdateLeadStatusParams {
  workspaceId: string
  leadId: string
  status: LeadStatus
}

interface UpdateLeadNotesParams {
  workspaceId: string
  leadId: string
  notes: string
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
  metadata?: Prisma.InputJsonValue
}

export async function upsertLead({
  workspaceId,
  email,
  firstName,
  lastName,
  metadata,
}: UpsertLeadParams) {
  const existing = await prisma.lead.findUnique({
    where: { workspaceId_email: { workspaceId, email } },
  })

  if (existing) {
    // Merge new metadata into existing — never overwrite unrelated keys
    const existingMeta =
      existing.metadata &&
      typeof existing.metadata === 'object' &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {}

    const mergedMeta: Prisma.InputJsonValue | undefined =
      metadata !== undefined
        ? ({
            ...existingMeta,
            ...(metadata as Record<string, unknown>),
          } as Prisma.InputJsonValue)
        : undefined

    return prisma.lead.update({
      where: { workspaceId_email: { workspaceId, email } },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(mergedMeta !== undefined && { metadata: mergedMeta }),
      },
    })
  }

  return createLead({
    workspaceId,
    email,
    firstName,
    lastName,
    metadata,
    source: 'chatbot',
  })
}

export async function listLeadsWithFilters({
  workspaceId,
  domainId,
  status,
  dateFrom,
  dateTo,
  limit = 100,
}: ListLeadsWithFiltersParams) {
  return prisma.lead.findMany({
    where: {
      workspaceId,
      ...(status !== undefined && { status }),
      ...(dateFrom !== undefined || dateTo !== undefined
        ? {
            createdAt: {
              ...(dateFrom !== undefined && { gte: dateFrom }),
              ...(dateTo !== undefined && { lte: dateTo }),
            },
          }
        : {}),
      ...(domainId !== undefined
        ? {
            sessions: {
              some: {
                chatbot: { domainId },
              },
            },
          }
        : {}),
    },
    include: {
      sessions: {
        select: {
          id: true,
          sessionUuid: true,
          chatbot: {
            select: {
              domain: { select: { id: true, hostname: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function findLeadById({
  workspaceId,
  leadId,
}: FindLeadByIdParams) {
  return prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
    include: {
      sessions: {
        select: {
          id: true,
          sessionUuid: true,
          status: true,
          createdAt: true,
          chatbot: {
            select: {
              domain: { select: { hostname: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      bookings: {
        orderBy: { startsAt: 'desc' },
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          status: true,
        },
      },
    },
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

export async function updateLeadNotes({
  workspaceId,
  leadId,
  notes,
}: UpdateLeadNotesParams) {
  return prisma.lead.update({
    data: { notes },
    where: { id: leadId, workspaceId },
  })
}
