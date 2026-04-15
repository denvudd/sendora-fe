import type { LeadStatus } from '@prisma/client'

export interface LeadWithSession {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  source: string | null
  status: LeadStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
  sessions: Array<{
    id: string
    sessionUuid: string
    chatbot: {
      domain: { id: string; hostname: string }
    }
  }>
}

export function leadDisplayName(lead: {
  firstName: string | null
  lastName: string | null
  email: string
}): string {
  const parts = [lead.firstName, lead.lastName].filter(Boolean)

  return parts.length > 0 ? parts.join(' ') : lead.email
}
