'use client'

import type {
  Feature,
  Plan,
  PlanFeature,
  WorkspaceSubscription,
} from '@prisma/client'
import type { ReactElement } from 'react'

import { cancelSubscriptionAction } from '@features/billing/actions/cancel-subscription-action'
import { changePlanAction } from '@features/billing/actions/change-plan-action'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { FieldError } from '@shared/components/ui/field'
import { useActionState, useState } from 'react'

type PlanWithFeatures = Plan & {
  features: (PlanFeature & { feature: Feature })[]
}

interface PlanUpgradeCardProps {
  plans: PlanWithFeatures[]
  currentSubscription: WorkspaceSubscription | null
}

interface ActionState {
  message?: string
}

function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) {
    return 'Free'
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(priceInCents / 100)
}

export function PlanUpgradeCard({
  plans,
  currentSubscription,
}: PlanUpgradeCardProps): ReactElement {
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>(
    currentSubscription?.billingInterval ?? 'MONTHLY',
  )
  const [changeState, changeAction, isChangePending] = useActionState<
    ActionState,
    FormData
  >(changePlanAction, {})
  const [cancelState, cancelAction, isCancelPending] = useActionState<
    ActionState,
    FormData
  >(cancelSubscriptionAction, {})

  const currentPlanId = currentSubscription?.planId
  const canCancel =
    currentSubscription &&
    !currentSubscription.cancelAtPeriodEnd &&
    currentSubscription.stripeSubscriptionId

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Available plans</h3>
        <div className="flex items-center gap-1.5 rounded-full border p-1">
          <button
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              billingInterval === 'MONTHLY'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            type="button"
            onClick={() => setBillingInterval('MONTHLY')}
          >
            Monthly
          </button>
          <button
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              billingInterval === 'YEARLY'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            type="button"
            onClick={() => setBillingInterval('YEARLY')}
          >
            Yearly
            <Badge className="text-[9px]" variant="secondary">
              −17%
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map(plan => {
          const price =
            billingInterval === 'YEARLY'
              ? (plan.yearlyPriceCents ?? plan.monthlyPriceCents)
              : plan.monthlyPriceCents
          const isCurrent = plan.id === currentPlanId

          return (
            <Card
              key={plan.id}
              className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge className="text-[10px]" variant="secondary">
                      Current
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {plan.description ?? ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-2">
                <div className="text-xl font-semibold">
                  {formatPrice(price)}
                  {price > 0 && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      /{billingInterval === 'YEARLY' ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>
                <ul className="space-y-1 text-xs">
                  {plan.features
                    .filter(pf => pf.isEnabled)
                    .map(pf => (
                      <li
                        key={pf.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-muted-foreground">
                          {pf.feature.name}
                        </span>
                        <span className="font-medium">
                          {pf.limitValue ?? 'Unlimited'}
                        </span>
                      </li>
                    ))}
                </ul>
              </CardContent>
              {!isCurrent && (
                <CardFooter>
                  <form action={changeAction} className="w-full">
                    <input name="planId" type="hidden" value={plan.id} />
                    <input
                      name="billingInterval"
                      type="hidden"
                      value={billingInterval}
                    />
                    <Button
                      className="w-full"
                      disabled={isChangePending}
                      size="sm"
                      type="submit"
                      variant={
                        (plan.monthlyPriceCents ?? 0) >
                        (plans.find(p => p.id === currentPlanId)
                          ?.monthlyPriceCents ?? 0)
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {isChangePending ? 'Updating…' : 'Switch to this plan'}
                    </Button>
                  </form>
                </CardFooter>
              )}
            </Card>
          )
        })}
      </div>

      {changeState.message && <FieldError>{changeState.message}</FieldError>}

      {canCancel && (
        <div className="border-t pt-4">
          <form action={cancelAction}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Cancel your subscription at the end of the current billing
                period.
              </p>
              <Button
                disabled={isCancelPending}
                size="sm"
                type="submit"
                variant="destructive"
              >
                {isCancelPending ? 'Cancelling…' : 'Cancel plan'}
              </Button>
            </div>
            {cancelState.message && (
              <FieldError className="mt-2">{cancelState.message}</FieldError>
            )}
          </form>
        </div>
      )}
    </div>
  )
}
