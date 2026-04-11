'use client'

import type { WorkspaceSubscription } from '@prisma/client'
import type { PlanWithFeatures } from '@shared/types/plan'
import type { ReactElement } from 'react'

import { cancelSubscriptionAction } from '@features/billing/actions/cancel-subscription-action'
import { changePlanAction } from '@features/billing/actions/change-plan-action'
import { BillingInterval as BillingIntervalEnum } from '@prisma/client'
import {
  PlanBillingIntervalToggle,
  PlansGrid,
} from '@shared/components/pricing'
import { Button } from '@shared/components/ui/button'
import { FieldError } from '@shared/components/ui/field'
import { useActionState, useState } from 'react'

interface PlanUpgradeCardProps {
  currentSubscription: WorkspaceSubscription | null
  plans: PlanWithFeatures[]
}

interface ActionState {
  message?: string
}

export function PlanUpgradeCard({
  plans,
  currentSubscription,
}: PlanUpgradeCardProps): ReactElement {
  const [billingInterval, setBillingInterval] = useState<BillingIntervalEnum>(
    currentSubscription?.billingInterval ?? BillingIntervalEnum.MONTHLY,
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
        <PlanBillingIntervalToggle
          value={billingInterval}
          onChange={setBillingInterval}
        />
      </div>

      <PlansGrid
        billingInterval={billingInterval}
        currentPlanId={currentPlanId}
        plans={plans}
        renderPlanFooter={(plan, { isCurrent }) =>
          isCurrent ? null : (
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
                  (plans.find(p => p.id === currentPlanId)?.monthlyPriceCents ??
                    0)
                    ? 'default'
                    : 'outline'
                }
              >
                {isChangePending ? 'Updating…' : 'Switch to this plan'}
              </Button>
            </form>
          )
        }
        variant="compact"
      />

      {changeState.message ? (
        <FieldError>{changeState.message}</FieldError>
      ) : null}

      {canCancel ? (
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
            {cancelState.message ? (
              <FieldError className="mt-2">{cancelState.message}</FieldError>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  )
}
