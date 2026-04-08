import { prisma } from '@shared/utils/prisma'

interface CreateWorkspaceParams {
  name: string
  ownerUserId: string
  slug: string
}

interface FindWorkspaceByOwnerParams {
  ownerUserId: string
}

export async function createWorkspace({
  ownerUserId,
  name,
  slug,
}: CreateWorkspaceParams) {
  return prisma.workspace.create({
    data: {
      name,
      ownerUserId,
      slug,
    },
  })
}

export async function findWorkspaceByOwner({
  ownerUserId,
}: FindWorkspaceByOwnerParams) {
  return prisma.workspace.findFirst({
    where: {
      ownerUserId,
    },
  })
}
