'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateWorkspace,
} from '@features/commercial/repositories'
import { updateWorkspaceSchema } from '@features/workspace-settings/schemas'
import { Prisma } from '@prisma/client'
import { getOptionalTrimmedString } from '@shared/utils/form-data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface UpdateWorkspaceState {
  errors?: {
    name?: string[]
    slug?: string[]
    logoUrl?: string[]
  }
  message?: string
  success?: boolean
}

export async function updateWorkspaceAction(
  _prevState: UpdateWorkspaceState,
  formData: FormData,
): Promise<UpdateWorkspaceState> {
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
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  const validated = updateWorkspaceSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    logoUrl: getOptionalTrimmedString(formData, 'logoUrl'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await updateWorkspace({
      workspaceId: workspace.id,
      name: validated.data.name,
      slug: validated.data.slug,
      logoUrl: validated.data.logoUrl || null,
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

  revalidatePath(ROUTES.WorkspaceSettings)

  return { success: true }
}
