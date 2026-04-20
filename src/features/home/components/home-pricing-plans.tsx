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

import { ROUTES } from '@/shared/constants/routes'

interface HomePricingPlansProps {
  plans: PlanWithFeatures[]
  isSignedIn: boolean
}

export function HomePricingPlans({
  plans,
  isSignedIn,
}: HomePricingPlansProps): ReactElement {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    BillingInterval.MONTHLY,
  )

  const handleBillingIntervalChange = (interval: BillingInterval) => {
    setBillingInterval(interval)
  }

  return (
    <section className="container max-w-6xl mx-auto" id="pricing">
      <div
        className="
            mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16
            lg:px-10
          "
      >
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose your right plan!
          </h2>
          <p className="text-muted-foreground text-lg">
            Select from best plans, ensuring a perfect match. Need more or less?
            Customize your subscription for a seamless fit!
          </p>
        </div>

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
                href={isSignedIn ? ROUTES.Billing : ROUTES.SignUp}
              >
                Get started
              </Link>
            )}
            variant="marketing"
          />
        </div>
      </div>
    </section>
  )
}
