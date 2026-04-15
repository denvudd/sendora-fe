import type { BookingStatus } from '@prisma/client'

export interface BookingWithLead {
  id: string
  title: string
  startsAt: Date
  endsAt: Date
  timezone: string
  status: BookingStatus
  lead: {
    email: string
    firstName: string | null
    lastName: string | null
  } | null
}

export function leadName(lead: BookingWithLead['lead']): string {
  if (!lead) {
    return 'Unknown'
  }

  const parts = [lead.firstName, lead.lastName].filter(Boolean)

  return parts.length > 0 ? parts.join(' ') : lead.email
}
