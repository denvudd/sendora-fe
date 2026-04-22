import type { NextRequest } from 'next/server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { exchangeCodeForTokens } from '@features/appointments/lib/google-meet'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateWorkspaceGoogleTokens,
} from '@features/commercial/repositories'
import { NextResponse } from 'next/server'

import { ROUTES } from '@/shared/constants/routes'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return NextResponse.redirect(new URL(ROUTES.SignIn, request.url))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`${ROUTES.Appointments}?google_error=access_denied`, request.url),
    )
  }

  try {
    const { refreshToken } = await exchangeCodeForTokens(code)

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? ''
    const dbUser = await findOrCreateUser({ clerkId, email })
    const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

    if (!workspace) {
      return NextResponse.redirect(new URL(ROUTES.Onboarding, request.url))
    }

    await updateWorkspaceGoogleTokens({
      workspaceId: workspace.id,
      refreshToken,
      enabled: true,
    })
  } catch (err) {
    console.error('[google/callback] Failed to exchange tokens:', err)

    return NextResponse.redirect(
      new URL(
        `${ROUTES.Appointments}?google_error=token_exchange`,
        request.url,
      ),
    )
  }

  return NextResponse.redirect(
    new URL(`${ROUTES.Appointments}?google_connected=1`, request.url),
  )
}
