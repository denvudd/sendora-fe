'use client'

import type { PlanWithFeatures } from '@shared/types/plan'

import { BillingInterval } from '@prisma/client'
import {
  PlanBillingIntervalToggle,
  PlansGrid,
} from '@shared/components/pricing'
import { buttonVariants } from '@shared/components/ui/button'
import Link from 'next/link'
import { useState, type ReactElement } from 'react'

interface HomePricingPlansProps {
  plans: PlanWithFeatures[]
}

export function HomePricingPlans({
  plans,
}: HomePricingPlansProps): ReactElement {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    BillingInterval.MONTHLY,
  )

  const handleBillingIntervalChange = (interval: BillingInterval) => {
    setBillingInterval(interval)
  }

  return (
    <div>
      <div className="flex justify-center mb-16">
        <PlanBillingIntervalToggle
          size="lg"
          value={billingInterval}
          onChange={handleBillingIntervalChange}
        />
      </div>
      <PlansGrid
        billingInterval={billingInterval}
        intervalLabelStyle="word"
        plans={plans}
        renderPlanFooter={() => (
          <Link
            className={buttonVariants({
              className: 'mt-auto w-full',
              size: 'lg',
            })}
            href="/sign-up"
          >
            Get started
          </Link>
        )}
        variant="marketing"
      />
    </div>
  )
}
