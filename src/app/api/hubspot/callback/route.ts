import type { NextRequest } from 'next/server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateWorkspaceHubSpotTokens,
} from '@features/commercial/repositories'
import {
  ensureSendoraLeadStatusProperty,
  exchangeHubSpotCode,
  getHubSpotAccessToken,
  getHubSpotPortalId,
} from '@features/workspace-settings/lib/hubspot'
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
      new URL(
        `${ROUTES.WorkspaceSettings}?hubspot_error=access_denied`,
        request.url,
      ),
    )
  }

  try {
    const { refreshToken } = await exchangeHubSpotCode(code)

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? ''
    const dbUser = await findOrCreateUser({ clerkId, email })
    const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

    if (!workspace) {
      return NextResponse.redirect(new URL(ROUTES.Onboarding, request.url))
    }

    const accessToken = await getHubSpotAccessToken(refreshToken)
    const portalId = await getHubSpotPortalId(accessToken)

    await updateWorkspaceHubSpotTokens({
      workspaceId: workspace.id,
      refreshToken,
      enabled: true,
      portalId: String(portalId),
    })

    await ensureSendoraLeadStatusProperty(accessToken)
  } catch (err) {
    console.error('[hubspot/callback] Failed to exchange tokens:', err)

    return NextResponse.redirect(
      new URL(
        `${ROUTES.WorkspaceSettings}?hubspot_error=token_exchange`,
        request.url,
      ),
    )
  }

  return NextResponse.redirect(
    new URL(`${ROUTES.WorkspaceSettings}?hubspot_connected=1`, request.url),
  )
}
