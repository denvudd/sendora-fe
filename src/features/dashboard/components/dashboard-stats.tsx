import type { DashboardKpis } from '@features/commercial/repositories'
import type { ReactElement } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { CalendarCheck, TrendingUp, UserCheck, Users2 } from 'lucide-react'

interface DashboardStatsProps {
  kpis: DashboardKpis
  conversionRate: number
}

export function DashboardStats({
  kpis,
  conversionRate,
}: DashboardStatsProps): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Leads
          </CardTitle>
          <Users2 className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {kpis.totalLeads.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">all time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Leads
          </CardTitle>
          <UserCheck className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {kpis.activeLeads.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            new · contacted · qualified
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Bookings
          </CardTitle>
          <CalendarCheck className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {kpis.totalBookings.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">all time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Conversion Rate
          </CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{conversionRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">leads won</p>
        </CardContent>
      </Card>
    </div>
  )
}
