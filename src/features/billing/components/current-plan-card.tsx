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
import { format } from 'date-fns'
import { ArrowRight, Clock } from 'lucide-react'

import { PLAN_CODE } from '@/shared/constants/plan-code'

type SubscriptionWithPlans = WorkspaceSubscription & {
  plan: Plan
  pendingPlan: Plan | null
}

interface CurrentPlanCardProps {
  subscription: SubscriptionWithPlans | null
}

function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return '—'
  }

  return format(date, 'MMMM d, yyyy')
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

  const hasPendingDowngrade =
    !!subscription.pendingPlanId && !!subscription.pendingPlan

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
            {subscription.plan.code === PLAN_CODE.STANDARD
              ? '-'
              : subscription.billingInterval.toLowerCase()}
          </span>
        </div>
        {subscription.currentPeriodEndAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {subscription.cancelAtPeriodEnd
                ? 'Cancels on'
                : hasPendingDowngrade
                  ? 'Current period ends'
                  : 'Next renewal'}
            </span>
            <span>{formatDate(subscription.currentPeriodEndAt)}</span>
          </div>
        )}

        {hasPendingDowngrade && subscription.pendingPlan && (
          <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="size-3.5" />
              Scheduled change
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{subscription.plan.name}</span>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium">
                {subscription.pendingPlan.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your plan will switch to{' '}
              <span className="font-medium text-foreground">
                {subscription.pendingPlan.name}
              </span>{' '}
              on {formatDate(subscription.currentPeriodEndAt)}. You keep full
              access to your current plan until then.
            </p>
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
