import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findActiveSubscriptionByWorkspaceId,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { HubSpotConnect } from '@features/workspace-settings/components/hubspot-connect'
import { WorkspaceSettingsForm } from '@features/workspace-settings/components/workspace-settings-form'
import { redirect } from 'next/navigation'

import { GoogleMeetConnect } from '@/features/appointments/components/google-meet-connect'
import { PLAN_CODE } from '@/shared/constants/plan-code'
import { ROUTES } from '@/shared/constants/routes'

const WorkspaceSettingsPage = async (): Promise<ReactElement> => {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect(ROUTES.SignIn)
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect(ROUTES.SignIn)
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  const subscription = await findActiveSubscriptionByWorkspaceId({
    workspaceId: workspace.id,
  })
  const planCode = subscription?.plan.code ?? PLAN_CODE.STANDARD
  const isHubSpotAllowed = planCode !== PLAN_CODE.STANDARD

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Workspace settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace name, slug, and logo.
        </p>
      </div>

      <WorkspaceSettingsForm workspace={workspace} />

      <GoogleMeetConnect isConnected={workspace.googleCalendarEnabled} />
      <HubSpotConnect
        isAllowed={isHubSpotAllowed}
        isConnected={workspace.hubspotEnabled}
      />
    </div>
  )
}

export default WorkspaceSettingsPage
