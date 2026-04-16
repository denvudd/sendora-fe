import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  getDashboardKpis,
  getLeadStatusCounts,
  getLeadsTrendLast30Days,
  listUpcomingBookingsWithLeads,
} from '@features/commercial/repositories'
import { DashboardPage } from '@features/dashboard/components/dashboard-page'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

const Dashboard = async (): Promise<ReactElement> => {
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

  const [kpis, leadStatusCounts, leadsTrend, allUpcomingBookings] =
    await Promise.all([
      getDashboardKpis({ workspaceId: workspace.id }),
      getLeadStatusCounts({ workspaceId: workspace.id }),
      getLeadsTrendLast30Days({ workspaceId: workspace.id }),
      listUpcomingBookingsWithLeads({
        workspaceId: workspace.id,
        from: new Date(),
      }),
    ])

  const conversionRate =
    kpis.totalLeads > 0
      ? Math.round((kpis.wonLeads / kpis.totalLeads) * 1000) / 10
      : 0

  return (
    <DashboardPage
      conversionRate={conversionRate}
      kpis={kpis}
      leadStatusCounts={leadStatusCounts}
      leadsTrend={leadsTrend}
      upcomingBookings={allUpcomingBookings.slice(0, 5)}
      workspace={workspace}
    />
  )
}

export default Dashboard
