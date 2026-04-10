import { prisma } from '@shared/utils/prisma'

interface CreateWorkspaceParams {
  userId: string
  name: string
  slug: string
  logoUrl?: string | null
  primaryColor?: string | null
}

interface FindWorkspaceByUserIdParams {
  userId: string
}

export async function createWorkspace({
  userId,
  name,
  slug,
  logoUrl,
  primaryColor,
}: CreateWorkspaceParams) {
  return prisma.workspace.create({
    data: {
      userId,
      name,
      slug,
      logoUrl: logoUrl ?? null,
      primaryColor: primaryColor ?? null,
    },
  })
}

export async function findWorkspaceByUserId({
  userId,
}: FindWorkspaceByUserIdParams) {
  return prisma.workspace.findUnique({ where: { userId } })
}
