'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  createWorkspace,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { createWorkspaceSchema } from '@features/onboarding/schemas'
import { Prisma } from '@prisma/client'
import { getOptionalTrimmedString } from '@shared/utils/form-data'
import { redirect } from 'next/navigation'

interface CreateWorkspaceState {
  errors?: {
    name?: string[]
    slug?: string[]
    logoUrl?: string[]
    primaryColor?: string[]
  }
  message?: string
  workspaceId?: string
}

export async function createWorkspaceAction(
  _prevState: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/sign-in')
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const existing = await findWorkspaceByUserId({ userId: dbUser.id })

  if (existing) {
    return { workspaceId: existing.id }
  }

  const validated = createWorkspaceSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    logoUrl: getOptionalTrimmedString(formData, 'logoUrl'),
    primaryColor: getOptionalTrimmedString(formData, 'primaryColor'),
  })

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    const workspace = await createWorkspace({
      userId: dbUser.id,
      name: validated.data.name,
      slug: validated.data.slug,
      logoUrl: validated.data.logoUrl || null,
      primaryColor: validated.data.primaryColor || null,
    })

    return { workspaceId: workspace.id }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        message: 'That slug is already taken. Please choose a different one.',
      }
    }

    return { message: 'Something went wrong. Please try again.' }
  }
}
