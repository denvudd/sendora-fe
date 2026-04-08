import { prisma } from '@shared/utils/prisma'

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
