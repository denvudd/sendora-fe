import { prisma } from '@shared/utils/prisma'

interface FindOrCreateUserParams {
  clerkId: string
  email: string
}

interface FindUserByClerkIdParams {
  clerkId: string
}

export async function findOrCreateUser({
  clerkId,
  email,
}: FindOrCreateUserParams) {
  return prisma.user.upsert({
    where: { clerkId },
    create: { clerkId, email },
    update: { email },
  })
}

export async function findUserByClerkId({ clerkId }: FindUserByClerkIdParams) {
  return prisma.user.findUnique({ where: { clerkId } })
}
