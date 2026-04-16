import { prisma } from '@shared/utils/prisma'

interface CreateWorkspaceParams {
  userId: string
  name: string
  slug: string
  logoUrl?: string | null
}

interface UpdateWorkspaceParams {
  workspaceId: string
  name: string
  slug: string
  logoUrl?: string | null
}

interface FindWorkspaceByUserIdParams {
  userId: string
}

interface UpdateWorkspaceStripeCustomerParams {
  workspaceId: string
  stripeCustomerId: string
}

interface FindWorkspaceByStripeCustomerIdParams {
  stripeCustomerId: string
}

export async function createWorkspace({
  userId,
  name,
  slug,
  logoUrl,
}: CreateWorkspaceParams) {
  return prisma.workspace.create({
    data: {
      userId,
      name,
      slug,
      logoUrl: logoUrl ?? null,
    },
  })
}

export async function updateWorkspace({
  workspaceId,
  name,
  slug,
  logoUrl,
}: UpdateWorkspaceParams) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { name, slug, logoUrl: logoUrl ?? null },
  })
}

export async function findWorkspaceByUserId({
  userId,
}: FindWorkspaceByUserIdParams) {
  return prisma.workspace.findUnique({ where: { userId } })
}

export async function updateWorkspaceStripeCustomerId({
  workspaceId,
  stripeCustomerId,
}: UpdateWorkspaceStripeCustomerParams) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId },
  })
}

export async function findWorkspaceByStripeCustomerId({
  stripeCustomerId,
}: FindWorkspaceByStripeCustomerIdParams) {
  return prisma.workspace.findUnique({ where: { stripeCustomerId } })
}
