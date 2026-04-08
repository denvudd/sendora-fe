import type { ReactElement } from 'react'

import { auth } from '@clerk/nextjs/server'
import { findWorkspaceByOwner } from '@features/commercial/repositories'
import { DashboardPage } from '@features/dashboard/components/dashboard-page'
import { redirect } from 'next/navigation'

const Dashboard = async (): Promise<ReactElement> => {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const workspace = await findWorkspaceByOwner({ ownerUserId: userId })

  if (!workspace) {
    redirect('/onboarding')
  }

  return <DashboardPage workspace={workspace} />
}

export default Dashboard
