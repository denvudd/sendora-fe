import { prisma } from '@shared/utils/prisma'

interface FindOrCreateUserParams {
  clerkId: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

interface FindUserByClerkIdParams {
  clerkId: string
}

export async function findOrCreateUser({
  clerkId,
  email,
  firstName,
  lastName,
}: FindOrCreateUserParams) {
  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    },
    update: {
      email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    },
  })
}

export async function findUserByClerkId({ clerkId }: FindUserByClerkIdParams) {
  return prisma.user.findUnique({ where: { clerkId } })
}

interface UpdateUserParams {
  id: string
  firstName?: string | null
  lastName?: string | null
}

export async function updateUser({
  id,
  firstName,
  lastName,
}: UpdateUserParams) {
  return prisma.user.update({
    where: { id },
    data: {
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    },
  })
}
