'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { buildBookingConfirmationEmail } from '@features/appointments/emails/booking-confirmation-email'
import { createGoogleMeetEvent } from '@features/appointments/lib/google-meet'
import {
  findBookingWithLeadById,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateBookingMeetingLink,
  updateBookingStatus,
} from '@features/commercial/repositories'
import { BookingStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'
import { resend } from '@/shared/lib/resend'

interface ConfirmBookingParams {
  bookingId: string
  meetingLink?: string
  generateGoogleMeet?: boolean
}

interface ConfirmBookingResult {
  success: boolean
  message?: string
}

export async function confirmBookingAction({
  bookingId,
  meetingLink,
  generateGoogleMeet,
}: ConfirmBookingParams): Promise<ConfirmBookingResult> {
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
      status: BookingStatus.CONFIRMED,
    })
  } catch {
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    }
  }

  const booking = await findBookingWithLeadById({
    bookingId,
    workspaceId: workspace.id,
  })

  if (!booking) {
    return { success: false, message: 'Booking not found after update.' }
  }

  let resolvedMeetingLink = meetingLink

  if (
    generateGoogleMeet &&
    workspace.googleCalendarEnabled &&
    workspace.googleRefreshToken
  ) {
    try {
      resolvedMeetingLink = await createGoogleMeetEvent({
        refreshToken: workspace.googleRefreshToken,
        title: booking.title,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        guestEmail: booking.lead?.email ?? undefined,
      })
    } catch (err) {
      console.error(
        '[confirmBookingAction] Google Meet generation failed:',
        err,
      )
    }
  }

  if (resolvedMeetingLink) {
    try {
      await updateBookingMeetingLink({
        bookingId,
        workspaceId: workspace.id,
        meetingLink: resolvedMeetingLink,
      })
    } catch (err) {
      console.error('[confirmBookingAction] Failed to save meeting link:', err)
    }
  }

  if (booking.lead?.email) {
    try {
      const { subject, html } = buildBookingConfirmationEmail({
        guestName: booking.lead.firstName ?? 'Guest',
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        timezone: booking.timezone,
        workspaceName: workspace.name,
        meetingLink: resolvedMeetingLink,
      })

      await resend.emails.send({
        from: 'Sendora <notifications@sendora.forum>',
        to: booking.lead.email,
        subject,
        html,
      })
    } catch (err) {
      console.error(
        '[confirmBookingAction] Failed to send confirmation email:',
        err,
      )
    }
  }

  revalidatePath(ROUTES.Appointments)

  return { success: true }
}
