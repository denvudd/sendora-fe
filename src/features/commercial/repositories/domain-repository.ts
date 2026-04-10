import { prisma } from '@shared/utils/prisma'

interface CreateDomainParams {
  workspaceId: string
  hostname: string
  isPrimary?: boolean
}

interface ListDomainsByWorkspaceParams {
  workspaceId: string
}

interface DeleteDomainParams {
  domainId: string
  workspaceId: string
}

interface SetPrimaryDomainParams {
  domainId: string
  workspaceId: string
}

interface UpdateDomainVerificationParams {
  domainId: string
  workspaceId: string
  isVerified: boolean
  verifiedAt?: Date | null
}

export async function createDomain({
  workspaceId,
  hostname,
  isPrimary = false,
}: CreateDomainParams) {
  return prisma.domain.create({
    data: { workspaceId, hostname, isPrimary },
  })
}

export async function listDomainsByWorkspace({
  workspaceId,
}: ListDomainsByWorkspaceParams) {
  return prisma.domain.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function deleteDomain({
  domainId,
  workspaceId,
}: DeleteDomainParams) {
  return prisma.domain.delete({
    where: { id: domainId, workspaceId },
  })
}

export async function setPrimaryDomain({
  domainId,
  workspaceId,
}: SetPrimaryDomainParams) {
  return prisma.$transaction([
    prisma.domain.updateMany({
      where: { workspaceId },
      data: { isPrimary: false },
    }),
    prisma.domain.update({
      where: { id: domainId, workspaceId },
      data: { isPrimary: true },
    }),
  ])
}

export async function updateDomainVerification({
  domainId,
  workspaceId,
  isVerified,
  verifiedAt,
}: UpdateDomainVerificationParams) {
  return prisma.domain.update({
    where: { id: domainId, workspaceId },
    data: { isVerified, verifiedAt: verifiedAt ?? null },
  })
}
