import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { WorkspaceSettingsForm } from '@features/workspace-settings/components/workspace-settings-form'
import { redirect } from 'next/navigation'

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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Workspace settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace name, slug, and logo.
        </p>
      </div>

      <WorkspaceSettingsForm workspace={workspace} />
    </div>
  )
}

export default WorkspaceSettingsPage
