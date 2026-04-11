'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  createDomain,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { createDomainSchema } from '@features/domains/schemas'
import { getOptionalTrimmedString } from '@shared/utils/form-data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface CreateDomainState {
  errors?: {
    hostname?: string[]
  }
  message?: string
}

export async function createDomainAction(
  _prevState: CreateDomainState,
  formData: FormData,
): Promise<CreateDomainState> {
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

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect('/onboarding')
  }

  const validated = createDomainSchema.safeParse({
    hostname: getOptionalTrimmedString(formData, 'hostname'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  let newDomainId: string

  try {
    const domain = await createDomain({
      workspaceId: workspace.id,
      hostname: validated.data.hostname,
    })

    newDomainId = domain.id
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Domain limit reached')) {
        return { message: error.message }
      }

      if (error.message.includes('Unique constraint')) {
        return { message: 'This hostname is already registered.' }
      }
    }

    return { message: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect(`/domains/${newDomainId}`)
}
