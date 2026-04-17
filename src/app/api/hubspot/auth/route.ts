import { auth } from '@clerk/nextjs/server'
import { buildHubSpotOAuthUrl } from '@features/workspace-settings/lib/hubspot'
import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = buildHubSpotOAuthUrl(userId)

  return NextResponse.redirect(url)
}
