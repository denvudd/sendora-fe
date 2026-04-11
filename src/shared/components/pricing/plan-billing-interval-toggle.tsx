'use client'

import type { BillingInterval } from '@shared/utils/format-plan-price'
import type { ReactElement } from 'react'

import { BillingInterval as BillingIntervalEnum } from '@prisma/client'
import { Badge } from '@shared/components/ui/badge'
import { cn } from '@shared/utils/cn'

import { Button } from '../ui/button'

interface PlanBillingIntervalToggleProps {
  className?: string
  onChange: (interval: BillingInterval) => void
  showSavingsBadge?: boolean
  savingsBadgeText?: string
  value: BillingInterval
  size?: 'default' | 'lg'
}

export function PlanBillingIntervalToggle({
  className,
  onChange,
  showSavingsBadge = true,
  savingsBadgeText = 'Save ~17%',
  value,
  size = 'default',
}: PlanBillingIntervalToggleProps): ReactElement {
  return (
    <div
      className={cn(
        'flex items-center border gap-1.5 rounded-lg bg-muted relative',
        size === 'lg' && 'p-1',
        className,
      )}
    >
      <Button
        size={size}
        type="button"
        variant={
          value === BillingIntervalEnum.MONTHLY ? 'outline' : 'secondary'
        }
        onClick={() => onChange('MONTHLY')}
      >
        Monthly
      </Button>
      <Button
        size={size}
        type="button"
        variant={value === BillingIntervalEnum.YEARLY ? 'outline' : 'secondary'}
        onClick={() => onChange('YEARLY')}
      >
        Yearly
      </Button>

      {showSavingsBadge && (
        <div className="absolute top-8 left-1/2 flex translate-x-[50%] items-center gap-2 z-10">
          <svg
            fill="none"
            height="13"
            viewBox="0 0 44 13"
            width="44"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M43.3545 6.80707C43.8358 6.53627 44.0065 5.92654 43.7356 5.4452C43.4648 4.96387 42.8551 4.7932 42.3738 5.06401L43.3545 6.80707ZM0.838976 1.56996C0.293901 1.65889 -0.0758734 2.17286 0.0130627 2.71794L1.46238 11.6005C1.55132 12.1456 2.06529 12.5153 2.61036 12.4264C3.15544 12.3375 3.52522 11.8235 3.43628 11.2784L2.148 3.38282L10.0436 2.09454C10.5887 2.0056 10.9584 1.49163 10.8695 0.946553C10.7806 0.401476 10.2666 0.0317028 9.72151 0.12064L0.838976 1.56996ZM42.8641 5.93554L42.3738 5.06401C30.515 11.736 21.3317 11.567 14.6639 9.46864C7.9198 7.34631 3.69905 3.26681 1.58402 1.74516L1.00001 2.55691L0.416003 3.36865C2.29076 4.71744 6.91598 9.12711 14.0635 11.3764C21.2873 13.6497 31.0411 13.7348 43.3545 6.80707L42.8641 5.93554Z"
              fill="var(--primary)"
              fillOpacity="0.6"
            />
          </svg>
          <Badge variant="outline">{savingsBadgeText}</Badge>
        </div>
      )}
    </div>
  )
}
