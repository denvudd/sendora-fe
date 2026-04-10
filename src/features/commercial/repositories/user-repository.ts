import { prisma } from '@shared/utils/prisma'

interface FindOrCreateUserParams {
  clerkId: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
}

interface FindUserByClerkIdParams {
  clerkId: string
}

export async function findOrCreateUser({
  clerkId,
  email,
  firstName,
  lastName,
  imageUrl,
}: FindOrCreateUserParams) {
  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      imageUrl: imageUrl ?? null,
    },
    update: {
      email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      imageUrl: imageUrl ?? null,
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
  imageUrl?: string | null
}

export async function updateUser({
  id,
  firstName,
  lastName,
  imageUrl,
}: UpdateUserParams) {
  return prisma.user.update({
    where: { id },
    data: {
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      imageUrl: imageUrl ?? null,
    },
  })
}
