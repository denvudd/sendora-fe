'use server'

import type { BookingStatus } from '@prisma/client'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateBookingStatus,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface UpdateBookingStatusResult {
  success: boolean
  message?: string
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus,
): Promise<UpdateBookingStatusResult> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect(ROUTES.SignIn)
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect(ROUTES.SignIn)
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    return { success: false, message: 'Workspace not found.' }
  }

  try {
    await updateBookingStatus({
      workspaceId: workspace.id,
      bookingId,
      status,
    })
  } catch {
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    }
  }

  revalidatePath('/appointments')

  return { success: true }
}
