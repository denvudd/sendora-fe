'use client'

import type { LeadDailyCount } from '@features/commercial/repositories'
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
import { format, parseISO } from 'date-fns'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface LeadsTrendChartProps {
  data: LeadDailyCount[]
}

const chartConfig: ChartConfig = {
  count: { label: 'New Leads', color: 'hsl(var(--chart-1))' },
}

export function LeadsTrendChart({ data }: LeadsTrendChartProps): ReactElement {
  const hasData = data.some(d => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Trend</CardTitle>
        <CardDescription>New leads over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer className="h-[220px] w-full" config={chartConfig}>
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id="leadsTrendGradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-count)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                interval="preserveStartEnd"
                tickFormatter={(v: string) => format(parseISO(v), 'MMM d')}
                tickLine={false}
              />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v: unknown) =>
                      format(parseISO(v as string), 'MMM d, yyyy')
                    }
                  />
                }
              />
              <Area
                dataKey="count"
                fill="url(#leadsTrendGradient)"
                stroke="var(--color-count)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No leads in the last 30 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
