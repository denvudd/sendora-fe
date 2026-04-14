import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import { BillingPage } from '@features/billing/components/billing-page'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

const SettingsBillingPage = async (): Promise<ReactElement> => {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/sign-in')
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <BillingPage workspaceId={workspace.id} />
    </div>
  )
}

export default SettingsBillingPage
