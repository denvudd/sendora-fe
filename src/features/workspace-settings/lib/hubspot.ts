import { env } from '@/env'

const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token'
const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize'
const HUBSPOT_CONTACTS_UPSERT_URL =
  'https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert'
const HUBSPOT_CONTACTS_BASE_URL =
  'https://api.hubapi.com/crm/v3/objects/contacts'
const HUBSPOT_PROPERTIES_URL =
  'https://api.hubapi.com/crm/v3/properties/contacts'

export const HUBSPOT_LEAD_STATUS_PROPERTY_NAME = 'sendora_lead_status'

export function buildHubSpotOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.HUBSPOT_CLIENT_ID,
    redirect_uri: env.HUBSPOT_REDIRECT_URI,
    scope:
      'crm.objects.contacts.read crm.objects.contacts.write crm.schemas.contacts.write',
    response_type: 'code',
    state,
  })

  return `${HUBSPOT_AUTH_URL}?${params.toString()}`
}

export async function exchangeHubSpotCode(
  code: string,
): Promise<{ refreshToken: string }> {
  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.HUBSPOT_CLIENT_ID,
      client_secret: env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: env.HUBSPOT_REDIRECT_URI,
      code,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HubSpot token exchange failed: ${res.status} ${body}`)
  }

  const data = (await res.json()) as { refresh_token?: string }

  if (!data.refresh_token) {
    throw new Error('No refresh token returned from HubSpot')
  }

  return { refreshToken: data.refresh_token }
}

export async function getHubSpotAccessToken(
  refreshToken: string,
): Promise<string> {
  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.HUBSPOT_CLIENT_ID,
      client_secret: env.HUBSPOT_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HubSpot token refresh failed: ${res.status} ${body}`)
  }

  const data = (await res.json()) as { access_token?: string }

  if (!data.access_token) {
    throw new Error('No access token returned from HubSpot')
  }

  return data.access_token
}

export async function ensureSendoraLeadStatusProperty(
  accessToken: string,
): Promise<void> {
  const res = await fetch(HUBSPOT_PROPERTIES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: HUBSPOT_LEAD_STATUS_PROPERTY_NAME,
      label: 'Sendora Lead Status',
      type: 'string',
      fieldType: 'text',
      groupName: 'contactinformation',
    }),
  })

  // 409 = property already exists — that's fine
  if (!res.ok && res.status !== 409) {
    const body = await res.text()
    console.error(
      `[HubSpot] Failed to create ${HUBSPOT_LEAD_STATUS_PROPERTY_NAME} property: ${res.status} ${body}`,
    )
  }
}

interface UpsertHubSpotContactParams {
  accessToken: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  sendoraLeadStatus?: string
}

export async function upsertHubSpotContact({
  accessToken,
  email,
  firstName,
  lastName,
  phone,
  sendoraLeadStatus,
}: UpsertHubSpotContactParams): Promise<string> {
  const properties: Record<string, string> = { email }

  if (firstName) {
    properties.firstname = firstName
  }

  if (lastName) {
    properties.lastname = lastName
  }

  if (phone) {
    properties.phone = phone
  }

  if (sendoraLeadStatus) {
    properties[HUBSPOT_LEAD_STATUS_PROPERTY_NAME] = sendoraLeadStatus
  }

  const res = await fetch(HUBSPOT_CONTACTS_UPSERT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: [{ id: email, idProperty: 'email', properties }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HubSpot upsert contact failed: ${res.status} ${body}`)
  }

  const data = (await res.json()) as {
    results?: Array<{ id: string }>
    errors?: Array<{ message: string }>
  }

  if (data.errors?.length) {
    throw new Error(`HubSpot upsert contact error: ${data.errors[0].message}`)
  }

  const contactId = data.results?.[0]?.id

  if (!contactId) {
    throw new Error('HubSpot upsert returned no contact ID')
  }

  return contactId
}

interface UpdateHubSpotContactPropertyParams {
  accessToken: string
  contactId: string
  property: string
  value: string
}

export async function updateHubSpotContactProperty({
  accessToken,
  contactId,
  property,
  value,
}: UpdateHubSpotContactPropertyParams): Promise<void> {
  const res = await fetch(`${HUBSPOT_CONTACTS_BASE_URL}/${contactId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: { [property]: value } }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HubSpot update property failed: ${res.status} ${body}`)
  }
}
