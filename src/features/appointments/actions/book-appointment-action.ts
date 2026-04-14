'use server'

import { bookingSchema } from '@features/appointments/schemas'
import {
  createBooking,
  findSessionByPortalToken,
  listBookingsForDateRange,
  upsertLead,
} from '@features/commercial/repositories'

interface BookAppointmentResult {
  success: boolean
  message?: string
  booking?: {
    id: string
    startsAt: string
    endsAt: string
    timezone: string
  }
}

export async function bookAppointmentAction(data: {
  portalToken: string
  startsAt: string
  endsAt: string
  timezone: string
  name: string
  email: string
}): Promise<BookAppointmentResult> {
  const validated = bookingSchema.safeParse(data)

  if (!validated.success) {
    return { success: false, message: 'Invalid booking data.' }
  }

  const session = await findSessionByPortalToken({
    portalToken: validated.data.portalToken,
  })

  if (!session) {
    return { success: false, message: 'Session not found.' }
  }

  const workspaceId = session.chatbot.domain.workspace.id
  const schedule = session.chatbot.domain.workspace.appointmentSchedule

  if (!schedule || !schedule.isEnabled) {
    return { success: false, message: 'Booking is not available.' }
  }

  // Re-check for conflicts (race condition guard)
  const startsAt = new Date(validated.data.startsAt)
  const endsAt = new Date(validated.data.endsAt)
  const buffer = schedule.bufferMinutes * 60 * 1000

  const conflicts = await listBookingsForDateRange({
    workspaceId,
    from: new Date(startsAt.getTime() - buffer),
    to: new Date(endsAt.getTime() + buffer),
  })

  if (conflicts.length > 0) {
    return {
      success: false,
      message: 'This time slot is no longer available. Please choose another.',
    }
  }

  try {
    const lead = await upsertLead({
      workspaceId,
      email: validated.data.email,
      firstName: validated.data.name,
    })

    const booking = await createBooking({
      workspaceId,
      leadId: lead.id,
      title: `Appointment — ${validated.data.name}`,
      startsAt,
      endsAt,
      timezone: validated.data.timezone,
    })

    return {
      success: true,
      booking: {
        id: booking.id,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        timezone: booking.timezone,
      },
    }
  } catch (err) {
    console.error('[bookAppointmentAction]', err)

    if (
      err instanceof Error &&
      err.message.startsWith('Contact limit reached')
    ) {
      return { success: false, message: err.message }
    }

    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    }
  }
}
