import type { Plan, WorkspaceSubscription } from '@prisma/client'
import type { ReactElement } from 'react'

import { Badge } from '@shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'

type SubscriptionWithPlan = WorkspaceSubscription & { plan: Plan }

interface CurrentPlanCardProps {
  subscription: SubscriptionWithPlan | null
}

function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function statusBadgeVariant(
  status: WorkspaceSubscription['status'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
    case 'TRIALING':
      return 'default'
    case 'PAST_DUE':
      return 'destructive'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function CurrentPlanCard({
  subscription,
}: CurrentPlanCardProps): ReactElement {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No active plan</CardTitle>
          <CardDescription>
            Select a plan below to unlock your workspace features.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">{subscription.plan.name}</CardTitle>
          <Badge variant={statusBadgeVariant(subscription.status)}>
            {subscription.status.charAt(0) +
              subscription.status.slice(1).toLowerCase().replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>
          {subscription.plan.description ?? 'Your current plan.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Billing</span>
          <span className="capitalize">
            {subscription.billingInterval.toLowerCase()}
          </span>
        </div>
        {subscription.currentPeriodEndAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {subscription.cancelAtPeriodEnd ? 'Cancels on' : 'Next renewal'}
            </span>
            <span>{formatDate(subscription.currentPeriodEndAt)}</span>
          </div>
        )}
        {subscription.cancelAtPeriodEnd && (
          <p className="text-xs text-muted-foreground">
            Your plan is scheduled to cancel at the end of the billing period.
            You will keep access until then.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
