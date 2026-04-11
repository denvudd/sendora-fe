import { checkFeatureAllowed } from '@features/commercial/lib/feature-limits'
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

interface FindDomainByIdParams {
  domainId: string
  workspaceId: string
}

interface UpdateDomainParams {
  domainId: string
  workspaceId: string
  hostname?: string
  iconUrl?: string | null
  isPrimary?: boolean
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
  const currentCount = await prisma.domain.count({ where: { workspaceId } })
  const check = await checkFeatureAllowed({
    workspaceId,
    featureCode: 'MAX_DOMAINS',
    currentCount,
  })

  if (!check.allowed) {
    throw new Error(
      `Domain limit reached. Your plan allows up to ${check.limit} domain${check.limit === 1 ? '' : 's'}.`,
    )
  }

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

export async function findDomainById({
  domainId,
  workspaceId,
}: FindDomainByIdParams) {
  return prisma.domain.findFirst({
    where: { id: domainId, workspaceId },
  })
}

export async function updateDomain({
  domainId,
  workspaceId,
  hostname,
  iconUrl,
  isPrimary,
}: UpdateDomainParams) {
  if (isPrimary) {
    const [, updated] = await prisma.$transaction([
      prisma.domain.updateMany({
        where: { workspaceId },
        data: { isPrimary: false },
      }),
      prisma.domain.update({
        where: { id: domainId, workspaceId },
        data: {
          ...(hostname !== undefined && { hostname }),
          ...(iconUrl !== undefined && { iconUrl }),
          isPrimary: true,
        },
      }),
    ])

    return updated
  }

  return prisma.domain.update({
    where: { id: domainId, workspaceId },
    data: {
      ...(hostname !== undefined && { hostname }),
      ...(iconUrl !== undefined && { iconUrl }),
      ...(isPrimary !== undefined && { isPrimary }),
    },
  })
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
