'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { findOrCreateUser, updateUser } from '@features/commercial/repositories'
import { updateUserSchema } from '@features/onboarding/schemas'
import { getOptionalTrimmedString } from '@shared/utils/form-data'
import { redirect } from 'next/navigation'

interface UpdateUserState {
  success?: boolean
  errors?: {
    firstName?: string[]
    lastName?: string[]
    imageUrl?: string[]
  }
  message?: string
}

export async function updateUserAction(
  _prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
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
    imageUrl: clerkUser.imageUrl,
  })

  const validated = updateUserSchema.safeParse({
    firstName: String(formData.get('firstName') ?? '').trim(),
    lastName: String(formData.get('lastName') ?? '').trim(),
    imageUrl: getOptionalTrimmedString(formData, 'imageUrl'),
  })

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    await updateUser({
      id: dbUser.id,
      firstName: validated.data.firstName ?? null,
      lastName: validated.data.lastName ?? null,
      imageUrl: validated.data.imageUrl ?? null,
    })
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
