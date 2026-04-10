'use client'

import type { Feature, Plan, PlanFeature } from '@prisma/client'
import type { ReactElement } from 'react'

import { selectPlanAction } from '@features/onboarding/actions/select-plan-action'
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

interface OnboardingStepPlanProps {
  workspaceId: string
  plans: PlanWithFeatures[]
}

interface SelectPlanState {
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

export function OnboardingStepPlan({
  workspaceId,
  plans,
}: OnboardingStepPlanProps): ReactElement {
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>(
    'MONTHLY',
  )
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [state, action, isPending] = useActionState<SelectPlanState, FormData>(
    selectPlanAction,
    {},
  )

  const currentPrice = (plan: PlanWithFeatures) =>
    billingInterval === 'YEARLY'
      ? (plan.yearlyPriceCents ?? plan.monthlyPriceCents)
      : plan.monthlyPriceCents

  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      <div className="flex items-center justify-center gap-2">
        <button
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            billingInterval === 'MONTHLY'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
          type="button"
          onClick={() => setBillingInterval('MONTHLY')}
        >
          Monthly
        </button>
        <button
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            billingInterval === 'YEARLY'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
          type="button"
          onClick={() => setBillingInterval('YEARLY')}
        >
          Yearly
          <Badge className="text-[10px]" variant="secondary">
            Save ~17%
          </Badge>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map(plan => {
          const price = currentPrice(plan)
          const isSelected = selectedPlanId === plan.id

          return (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <CardDescription className="text-xs">
                  {plan.description ?? 'Flexible plan for your team.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-2">
                <div className="text-2xl font-semibold">
                  {formatPrice(price)}
                  {price > 0 && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      /{billingInterval === 'YEARLY' ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5 text-xs">
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
              <CardFooter>
                <div
                  className={`h-2 w-2 rounded-full border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                />
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {state.message && <FieldError>{state.message}</FieldError>}

      <form action={action}>
        <input name="workspaceId" type="hidden" value={workspaceId} />
        <input name="planId" type="hidden" value={selectedPlanId ?? ''} />
        <input name="billingInterval" type="hidden" value={billingInterval} />
        <Button
          className="w-full"
          disabled={isPending || !selectedPlanId}
          size="lg"
          type="submit"
        >
          {isPending ? 'Setting up…' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
