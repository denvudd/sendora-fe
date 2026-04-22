'use client'

import type { LeadStatusCount } from '@features/commercial/repositories'
import type { LeadStatus } from '@prisma/client'
import type { ChartConfig } from '@shared/components/ui/chart'
import type { ReactElement } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@shared/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface LeadsStatusChartProps {
  data: LeadStatusCount[]
}

const STATUS_DISPLAY: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  WON: 'Won',
  LOST: 'Lost',
}

const chartConfig: ChartConfig = {
  count: { label: 'Leads', color: 'hsl(var(--chart-2))' },
}

export function LeadsStatusChart({
  data,
}: LeadsStatusChartProps): ReactElement {
  const hasData = data.some(d => d.count > 0)

  const chartData = data.map(d => ({
    status: STATUS_DISPLAY[d.status],
    count: d.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by Status</CardTitle>
        <CardDescription>
          Distribution across all pipeline stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer className="h-[220px] w-full" config={chartConfig}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis axisLine={false} dataKey="status" tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No lead data yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
