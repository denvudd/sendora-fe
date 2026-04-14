'use server'

import { TZDate } from '@date-fns/tz'
import {
  findSessionByPortalToken,
  listBookingsForDateRange,
} from '@features/commercial/repositories'
import {
  format,
  getDate,
  getISODay,
  getMonth,
  getYear,
  parseISO,
} from 'date-fns'

export interface AvailableSlot {
  label: string
  startsAt: string
  endsAt: string
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

function buildSlotsForRange(
  year: number,
  month: number,
  day: number,
  rangeStr: string,
  slotDuration: number,
  bufferMinutes: number,
  timezone: string,
): AvailableSlot[] {
  const [startStr, endStr] = rangeStr.split('-')
  const rangeStartMinutes = parseTimeToMinutes(startStr)
  const rangeEndMinutes = parseTimeToMinutes(endStr)

  const slots: AvailableSlot[] = []
  let cursor = rangeStartMinutes

  while (cursor + slotDuration <= rangeEndMinutes) {
    const startH = Math.floor(cursor / 60)
    const startM = cursor % 60
    const endCursor = cursor + slotDuration
    const endH = Math.floor(endCursor / 60)
    const endM = endCursor % 60

    const tzStart = new TZDate(year, month, day, startH, startM, 0, timezone)
    const tzEnd = new TZDate(year, month, day, endH, endM, 0, timezone)

    slots.push({
      label: format(tzStart, 'h:mm a'),
      startsAt: tzStart.toISOString(),
      endsAt: tzEnd.toISOString(),
    })

    cursor += slotDuration + bufferMinutes
  }

  return slots
}

export async function getAvailableSlotsAction(
  portalToken: string,
  dateStr: string,
): Promise<AvailableSlot[]> {
  const session = await findSessionByPortalToken({ portalToken })

  if (!session) {
    return []
  }

  const schedule = session.chatbot.domain.workspace.appointmentSchedule

  if (!schedule || !schedule.isEnabled) {
    return []
  }

  const isoDay = getISODay(parseISO(dateStr)) // 1=Mon … 7=Sun
  const dayRanges =
    (schedule.schedule as Record<string, string[]>)[String(isoDay)] ?? []

  if (dayRanges.length === 0) {
    return []
  }

  const parsed = parseISO(dateStr)
  const year = getYear(parsed)
  const month = getMonth(parsed) // already 0-indexed
  const day = getDate(parsed)
  const timezone = schedule.timezone
  const workspaceId = session.chatbot.domain.workspace.id

  const tzDayStart = new TZDate(year, month, day, 0, 0, 0, timezone)
  const tzDayEnd = new TZDate(year, month, day, 23, 59, 59, timezone)

  const existingBookings = await listBookingsForDateRange({
    workspaceId,
    from: tzDayStart,
    to: tzDayEnd,
  })

  const allSlots: AvailableSlot[] = dayRanges.flatMap(range =>
    buildSlotsForRange(
      year,
      month,
      day,
      range,
      schedule.slotDuration,
      schedule.bufferMinutes,
      timezone,
    ),
  )

  const bufferMs = schedule.bufferMinutes * 60 * 1000

  return allSlots.filter(slot => {
    const slotStart = new Date(slot.startsAt).getTime()
    const slotEnd = new Date(slot.endsAt).getTime()

    return !existingBookings.some(booking => {
      const bookingStart = booking.startsAt.getTime() - bufferMs
      const bookingEnd = booking.endsAt.getTime() + bufferMs

      return slotStart < bookingEnd && slotEnd > bookingStart
    })
  })
}
