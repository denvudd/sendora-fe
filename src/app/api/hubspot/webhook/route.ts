import type { NextRequest } from 'next/server'

import crypto from 'crypto'

import {
  findLeadByHubSpotContactId,
  updateLeadContactFields,
} from '@features/commercial/repositories'
import { NextResponse } from 'next/server'

import { env } from '@/env'

export const dynamic = 'force-dynamic'

interface HubSpotWebhookEvent {
  objectId: number
  propertyName: string
  propertyValue: string
  occurredAt: number
  subscriptionType: string
}

function verifyHubSpotSignature(
  signature: string,
  timestamp: string,
  method: string,
  url: string,
  body: string,
): boolean {
  const message = `${method}${url}${body}${timestamp}`
  const hash = crypto
    .createHmac('sha256', env.HUBSPOT_CLIENT_SECRET)
    .update(message)
    .digest('base64')

  return hash === signature
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get('X-HubSpot-Signature-v3') ?? ''
  const timestamp = request.headers.get('X-HubSpot-Request-Timestamp') ?? ''

  const body = await request.text()

  if (
    !verifyHubSpotSignature(signature, timestamp, 'POST', request.url, body)
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Reject requests older than 5 minutes to prevent replay attacks
  const requestAge = Date.now() - Number(timestamp)

  if (requestAge > 5 * 60 * 1000) {
    return NextResponse.json({ error: 'Request too old' }, { status: 401 })
  }

  let events: HubSpotWebhookEvent[]

  try {
    events = JSON.parse(body) as HubSpotWebhookEvent[]
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  for (const event of events) {
    if (event.subscriptionType !== 'contact.propertyChange') {
      continue
    }

    const hubspotContactId = String(event.objectId)
    const lead = await findLeadByHubSpotContactId({ hubspotContactId })

    if (!lead) {
      continue
    }

    if (
      lead.hubspotSyncedAt &&
      lead.hubspotSyncedAt.getTime() > event.occurredAt
    ) {
      continue
    }

    const fields: { firstName?: string; lastName?: string; phone?: string } = {}

    if (event.propertyName === 'firstname') {
      fields.firstName = event.propertyValue
    } else if (event.propertyName === 'lastname') {
      fields.lastName = event.propertyValue
    } else if (event.propertyName === 'phone') {
      fields.phone = event.propertyValue
    } else {
      continue
    }

    try {
      await updateLeadContactFields({
        workspaceId: lead.workspaceId,
        leadId: lead.id,
        ...fields,
      })
    } catch (err) {
      console.error('[hubspot/webhook] Failed to update lead:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
