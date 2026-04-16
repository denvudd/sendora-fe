'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { buildBookingConfirmationEmail } from '@features/appointments/emails/booking-confirmation-email'
import {
  findBookingWithLeadById,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateBookingStatus,
} from '@features/commercial/repositories'
import { BookingStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'
import { resend } from '@/shared/lib/resend'

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

  if (status === BookingStatus.CONFIRMED) {
    try {
      const booking = await findBookingWithLeadById({
        bookingId,
        workspaceId: workspace.id,
      })

      if (booking?.lead?.email) {
        const { subject, html } = buildBookingConfirmationEmail({
          guestName: booking.lead.firstName ?? 'Guest',
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          timezone: booking.timezone,
          workspaceName: workspace.name,
        })

        await resend.emails.send({
          from: 'Sendora <notifications@sendora.forum>',
          to: booking.lead.email,
          subject,
          html,
        })
      }
    } catch (err) {
      console.error(
        '[updateBookingStatusAction] Failed to send confirmation email:',
        err,
      )
    }
  }

  revalidatePath('/appointments')

  return { success: true }
}
