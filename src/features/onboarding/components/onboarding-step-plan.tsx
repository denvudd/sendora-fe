'use client'

import type { PlanWithFeatures } from '@shared/types/plan'
import type { ReactElement } from 'react'

import { selectPlanAction } from '@features/onboarding/actions/select-plan-action'
import {
  PlanBillingIntervalToggle,
  PlansGrid,
} from '@shared/components/pricing'
import { Button } from '@shared/components/ui/button'
import { FieldError } from '@shared/components/ui/field'
import { useActionState, useState } from 'react'

interface OnboardingStepPlanProps {
  workspaceId: string
  plans: PlanWithFeatures[]
}

interface SelectPlanState {
  message?: string
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

  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      <div className="flex items-center justify-center gap-2">
        <PlanBillingIntervalToggle
          value={billingInterval}
          onChange={setBillingInterval}
        />
      </div>

      <PlansGrid
        billingInterval={billingInterval}
        plans={plans}
        renderPlanFooter={(_plan, { isSelected }) => (
          <div
            className={`h-2 w-2 rounded-full border transition-colors ${
              isSelected
                ? 'border-primary bg-primary'
                : 'border-muted-foreground'
            }`}
          />
        )}
        selectedPlanId={selectedPlanId}
        variant="compact"
        onPlanSelect={setSelectedPlanId}
      />

      {state.message ? <FieldError>{state.message}</FieldError> : null}

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
