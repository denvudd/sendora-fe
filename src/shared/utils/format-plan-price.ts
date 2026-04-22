import type { PlanWithFeatures } from '@shared/types/plan'

export type BillingInterval = 'MONTHLY' | 'YEARLY'

interface FormatPlanPriceOptions {
  treatZeroAsFree?: boolean
}

export function getPlanPriceCents({
  plan,
  billingInterval,
}: {
  billingInterval: BillingInterval
  plan: PlanWithFeatures
}): number {
  return billingInterval === 'YEARLY'
    ? (plan.yearlyPriceCents ?? plan.monthlyPriceCents)
    : plan.monthlyPriceCents
}

export function formatPlanPrice(
  priceInCents: number,
  { treatZeroAsFree = false }: FormatPlanPriceOptions = {},
): string {
  if (priceInCents === 0 && treatZeroAsFree) {
    return 'Free'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'decimal',
  }).format(priceInCents / 100)
}
