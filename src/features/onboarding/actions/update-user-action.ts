'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { updateUserSchema } from '@features/onboarding/schemas'
import { redirect } from 'next/navigation'

interface UpdateUserState {
  success?: boolean
  errors?: {
    firstName?: string[]
    lastName?: string[]
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

  const validated = updateUserSchema.safeParse({
    firstName: String(formData.get('firstName') ?? '').trim(),
    lastName: String(formData.get('lastName') ?? '').trim(),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    const client = await clerkClient()

    await client.users.updateUser(clerkId, {
      firstName: validated.data.firstName,
      lastName: validated.data.lastName,
    })
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
