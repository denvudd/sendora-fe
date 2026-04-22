import type { LeadStatusCount } from '@features/commercial/repositories'
import type { LeadStatus } from '@prisma/client'
import type { ReactElement } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { cn } from '@shared/utils/cn'

interface LeadsFunnelProps {
  data: LeadStatusCount[]
}

interface FunnelStage {
  status: LeadStatus
  label: string
  colorClass: string
}

const FUNNEL_STAGES: FunnelStage[] = [
  { status: 'NEW', label: 'New', colorClass: 'bg-muted-foreground/40' },
  { status: 'CONTACTED', label: 'Contacted', colorClass: 'bg-primary/50' },
  { status: 'QUALIFIED', label: 'Qualified', colorClass: 'bg-primary/75' },
  { status: 'WON', label: 'Won', colorClass: 'bg-primary' },
]

export function LeadsFunnel({ data }: LeadsFunnelProps): ReactElement {
  const statusMap = new Map(data.map(d => [d.status, d.count]))

  const referenceCount = FUNNEL_STAGES.reduce(
    (sum, stage) => sum + (statusMap.get(stage.status) ?? 0),
    0,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Lead progression through pipeline stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {referenceCount === 0 ? (
          <div className="flex h-[180px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No lead data yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {FUNNEL_STAGES.map(({ status, label, colorClass }) => {
              const count = statusMap.get(status) ?? 0
              const pct =
                referenceCount > 0
                  ? Math.round((count / referenceCount) * 100)
                  : 0

              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        colorClass,
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
