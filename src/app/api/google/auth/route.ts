import { auth } from '@clerk/nextjs/server'
import { buildGoogleOAuthUrl } from '@features/appointments/lib/google-meet'
import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = buildGoogleOAuthUrl(userId)

  return NextResponse.redirect(url)
}
