import { type BookingStatus } from '@prisma/client'
import { prisma } from '@shared/utils/prisma'

interface CreateBookingParams {
  workspaceId: string
  leadId?: string
  title: string
  startsAt: Date
  endsAt: Date
  timezone: string
  expectedValueCents?: number
  externalCalendarRef?: string
  note?: string
}

interface ListBookingsByWorkspaceParams {
  workspaceId: string
  from?: Date
  to?: Date
}

interface UpdateBookingStatusParams {
  workspaceId: string
  bookingId: string
  status: BookingStatus
}

export async function createBooking({
  workspaceId,
  leadId,
  title,
  startsAt,
  endsAt,
  timezone,
  expectedValueCents,
  externalCalendarRef,
  note,
}: CreateBookingParams) {
  return prisma.booking.create({
    data: {
      workspaceId,
      leadId,
      title,
      startsAt,
      endsAt,
      timezone,
      expectedValueCents,
      externalCalendarRef,
      note,
    },
  })
}

export async function listBookingsByWorkspace({
  workspaceId,
  from,
  to,
}: ListBookingsByWorkspaceParams) {
  return prisma.booking.findMany({
    orderBy: {
      startsAt: 'asc',
    },
    where: {
      startsAt: {
        gte: from,
        lte: to,
      },
      workspaceId,
    },
  })
}

export async function updateBookingStatus({
  workspaceId,
  bookingId,
  status,
}: UpdateBookingStatusParams) {
  return prisma.booking.update({
    data: {
      status,
    },
    where: {
      id: bookingId,
      workspaceId,
    },
  })
}
