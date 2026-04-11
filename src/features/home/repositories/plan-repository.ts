import { prisma } from '@shared/utils/prisma'

interface FindPlanByCodeParams {
  code: string
}

interface FindPlanByIdParams {
  id: string
}

export async function findPlanByCode({ code }: FindPlanByCodeParams) {
  return prisma.plan.findUnique({
    where: { code },
    include: {
      features: {
        include: { feature: true },
      },
    },
  })
}

export async function findPlanById({ id }: FindPlanByIdParams) {
  return prisma.plan.findUnique({
    where: { id },
    include: {
      features: {
        include: { feature: true },
      },
    },
  })
}

export async function listActivePlans() {
  return prisma.plan.findMany({
    include: {
      features: {
        include: {
          feature: true,
        },
        orderBy: {
          feature: {
            name: 'asc',
          },
        },
      },
    },
    orderBy: {
      monthlyPriceCents: 'asc',
    },
    where: {
      isActive: true,
    },
  })
}
