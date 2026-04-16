import type { BookingWithLead } from '@features/appointments/utils'
import type {
  DashboardKpis,
  LeadDailyCount,
  LeadStatusCount,
} from '@features/commercial/repositories'
import type { Workspace } from '@prisma/client'
import type { ReactElement } from 'react'

import { DashboardStats } from './dashboard-stats'
import { LeadsFunnel } from './leads-funnel'
import { LeadsStatusChart } from './leads-status-chart'
import { LeadsTrendChart } from './leads-trend-chart'
import { UpcomingBookingsList } from './upcoming-bookings-list'

interface DashboardPageProps {
  workspace: Workspace
  kpis: DashboardKpis
  conversionRate: number
  leadStatusCounts: LeadStatusCount[]
  leadsTrend: LeadDailyCount[]
  upcomingBookings: BookingWithLead[]
}

export function DashboardPage({
  workspace,
  kpis,
  conversionRate,
  leadStatusCounts,
  leadsTrend,
  upcomingBookings,
}: DashboardPageProps): ReactElement {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10 lg:px-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of your workspace performance.
        </p>
      </header>

      <DashboardStats conversionRate={conversionRate} kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadsTrendChart data={leadsTrend} />
        <LeadsStatusChart data={leadStatusCounts} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadsFunnel data={leadStatusCounts} />
        <UpcomingBookingsList bookings={upcomingBookings} />
      </div>
    </main>
  )
}
