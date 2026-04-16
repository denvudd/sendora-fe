import { BookingStatus } from '@prisma/client'
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

interface ListUpcomingBookingsWithLeadsParams {
  workspaceId: string
  from: Date
}

export async function listUpcomingBookingsWithLeads({
  workspaceId,
  from,
}: ListUpcomingBookingsWithLeadsParams) {
  return prisma.booking.findMany({
    where: { workspaceId, startsAt: { gte: from } },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      status: true,
      meetingLink: true,
      lead: { select: { email: true, firstName: true, lastName: true } },
    },
    take: 50,
  })
}

interface ListBookingsForDateRangeParams {
  workspaceId: string
  from: Date
  to: Date
}

export async function listBookingsForDateRange({
  workspaceId,
  from,
  to,
}: ListBookingsForDateRangeParams) {
  return prisma.booking.findMany({
    where: {
      workspaceId,
      status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
    select: { startsAt: true, endsAt: true },
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

interface FindBookingWithLeadByIdParams {
  bookingId: string
  workspaceId: string
}

export async function findBookingWithLeadById({
  bookingId,
  workspaceId,
}: FindBookingWithLeadByIdParams) {
  return prisma.booking.findUnique({
    where: { id: bookingId, workspaceId },
    include: {
      lead: { select: { email: true, firstName: true, lastName: true } },
    },
  })
}

interface UpdateBookingMeetingLinkParams {
  bookingId: string
  workspaceId: string
  meetingLink: string
}

export async function updateBookingMeetingLink({
  bookingId,
  workspaceId,
  meetingLink,
}: UpdateBookingMeetingLinkParams) {
  return prisma.booking.update({
    where: { id: bookingId, workspaceId },
    data: { meetingLink },
  })
}
