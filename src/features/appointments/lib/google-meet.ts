import { google } from 'googleapis'

import { env } from '@/env'

interface CreateGoogleMeetEventParams {
  refreshToken: string
  title: string
  startsAt: Date
  endsAt: Date
  guestEmail?: string
}

export async function createGoogleMeetEvent({
  refreshToken,
  title,
  startsAt,
  endsAt,
  guestEmail,
}: CreateGoogleMeetEventParams): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )

  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const requestId = `sendora-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      start: { dateTime: startsAt.toISOString() },
      end: { dateTime: endsAt.toISOString() },
      attendees: guestEmail ? [{ email: guestEmail }] : [],
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const meetLink = event.data.conferenceData?.entryPoints?.find(
    ep => ep.entryPointType === 'video',
  )?.uri

  if (!meetLink) {
    throw new Error('Google Meet link was not generated')
  }

  return meetLink
}

export function buildGoogleOAuthUrl(state: string): string {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state,
  })
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<{ refreshToken: string }> {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    throw new Error('No refresh token returned. Revoke access and try again.')
  }

  return { refreshToken: tokens.refresh_token }
}
