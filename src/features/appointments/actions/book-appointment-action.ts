'use server'

import { bookingSchema } from '@features/appointments/schemas'
import {
  closeSession,
  createBooking,
  findSessionByPortalToken,
  linkSessionToLead,
  listBookingsForDateRange,
  upsertLead,
} from '@features/commercial/repositories'
import { syncLeadToHubSpot } from '@features/workspace-settings/lib/sync-lead-to-hubspot'
import {
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
  pusherServer,
} from '@shared/lib/pusher'

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
    // Extract questionnaire answers from session metadata and map to readable format
    const sessionMeta =
      session.metadata &&
      typeof session.metadata === 'object' &&
      !Array.isArray(session.metadata)
        ? (session.metadata as Record<string, unknown>)
        : {}

    const rawAnswers =
      sessionMeta.answers &&
      typeof sessionMeta.answers === 'object' &&
      !Array.isArray(sessionMeta.answers)
        ? (sessionMeta.answers as Record<string, string>)
        : null

    const questionMap = Object.fromEntries(
      session.chatbot.questions.map(q => [q.id, q.text]),
    )

    const questionnaireAnswers = rawAnswers
      ? Object.entries(rawAnswers)
          .filter(([, answer]) => answer.trim().length > 0)
          .map(([questionId, answer]) => ({
            question: questionMap[questionId] ?? questionId,
            answer,
          }))
      : undefined

    const lead = await upsertLead({
      workspaceId,
      email: validated.data.email,
      firstName: validated.data.name,
      ...(questionnaireAnswers !== undefined && questionnaireAnswers.length > 0
        ? { metadata: { questionnaireAnswers } }
        : {}),
    })

    // Link the ChatSession to the Lead so operators can trace conversation → lead
    await linkSessionToLead({ sessionId: session.id, leadId: lead.id })

    void syncLeadToHubSpot({
      workspaceId,
      leadId: lead.id,
      email: validated.data.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      hubspotContactId: lead.hubspotContactId,
    })

    const booking = await createBooking({
      workspaceId,
      leadId: lead.id,
      title: `Appointment — ${validated.data.name}`,
      startsAt,
      endsAt,
      timezone: validated.data.timezone,
    })

    const closed = await closeSession({ sessionId: session.id })

    void Promise.all([
      pusherServer.trigger(
        PUSHER_CHANNELS.chatSession(closed.sessionUuid),
        PUSHER_EVENTS.SESSION_CLOSED,
        {},
      ),
      pusherServer.trigger(
        PUSHER_CHANNELS.workspace(workspaceId),
        PUSHER_EVENTS.SESSION_UPDATED,
        { sessionId: closed.id, lastMessage: '', status: 'CLOSED' },
      ),
    ])

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
