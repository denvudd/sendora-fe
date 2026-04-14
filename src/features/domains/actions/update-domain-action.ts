'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findDomainById,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateDomain,
} from '@features/commercial/repositories'
import { updateDomainSchema } from '@features/domains/schemas'
import { Prisma } from '@prisma/client'
import { getOptionalTrimmedString } from '@shared/utils/form-data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface UpdateDomainState {
  errors?: {
    hostname?: string[]
    iconUrl?: string[]
  }
  message?: string
  success?: boolean
}

export async function updateDomainAction(
  domainId: string,
  _prevState: UpdateDomainState,
  formData: FormData,
): Promise<UpdateDomainState> {
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
    redirect(ROUTES.Onboarding)
  }

  const domain = await findDomainById({ domainId, workspaceId: workspace.id })

  if (!domain) {
    return { message: 'Domain not found.' }
  }

  const iconUrl = getOptionalTrimmedString(formData, 'iconUrl')

  const validated = updateDomainSchema.safeParse({
    hostname: getOptionalTrimmedString(formData, 'hostname'),
    iconUrl: iconUrl || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await updateDomain({
      domainId,
      workspaceId: workspace.id,
      hostname: validated.data.hostname,
      iconUrl: iconUrl || null,
    })

    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return { message: 'This hostname is already registered.' }
    }

    return { message: 'Something went wrong. Please try again.' }
  }
}
