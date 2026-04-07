import { type LeadStatus, type Prisma } from '@prisma/client'
import { prisma } from '@shared/utils/prisma'

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
