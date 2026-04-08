'use server'

import { auth } from '@clerk/nextjs/server'
import {
  createWorkspace,
  findWorkspaceByOwner,
} from '@features/commercial/repositories'
import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters.')
    .trim(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters.')
    .max(48, 'Slug must be 48 characters or fewer.')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens.',
    )
    .trim(),
})

interface CreateWorkspaceState {
  errors?: {
    name?: string[]
    slug?: string[]
  }
  message?: string
}

export async function createWorkspaceAction(
  _prevState: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const existing = await findWorkspaceByOwner({ ownerUserId: userId })

  if (existing) {
    redirect('/dashboard')
  }

  const validated = CreateWorkspaceSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    await createWorkspace({
      name: validated.data.name,
      ownerUserId: userId,
      slug: validated.data.slug,
    })
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

  redirect('/dashboard')
}
