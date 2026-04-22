import type { BillingInterval } from '@/shared/utils/format-plan-price'

import { BillingInterval as BillingIntervalEnum } from '@prisma/client'

export function getIntervalSuffix({
  billingInterval,
  style,
}: {
  billingInterval: BillingInterval
  style: 'abbreviated' | 'word'
}): string {
  if (style === 'word') {
    return billingInterval === BillingIntervalEnum.YEARLY ? '/ year' : '/ month'
  }

  return billingInterval === BillingIntervalEnum.YEARLY ? '/ yr' : '/ mo'
}
