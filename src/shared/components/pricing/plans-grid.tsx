'use client'

import type { PlanWithFeatures } from '@shared/types/plan'
import type { BillingInterval } from '@shared/utils/format-plan-price'
import type { JSXElementConstructor, ReactElement, ReactNode } from 'react'

import { Badge } from '@shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@shared/components/ui/card'
import { cn } from '@shared/utils/cn'
import {
  formatPlanPrice,
  getPlanPriceCents,
} from '@shared/utils/format-plan-price'
import { Rocket, BriefcaseBusiness, Crown } from 'lucide-react'

import { Separator } from '../ui/separator'

import { PlansGridEmpty } from './plans-grid-empty'
import { getIntervalSuffix } from './utils'

const PLAN_CARDS_ICON_MAP = [Rocket, BriefcaseBusiness, Crown] as const

export interface PlanFooterRenderContext {
  billingInterval: BillingInterval
  isCurrent: boolean
  isSelected: boolean
  priceCents: number
}

interface PlansGridProps {
  billingInterval: BillingInterval
  className?: string
  currentPlanId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emptyState?: () => ReactElement<unknown, string | JSXElementConstructor<any>>
  gridClassName?: string
  intervalLabelStyle?: 'abbreviated' | 'word'
  onPlanSelect?: (planId: string) => void
  plans: PlanWithFeatures[]
  renderPlanFooter?: (
    plan: PlanWithFeatures,
    context: PlanFooterRenderContext,
  ) => ReactNode
  selectedPlanId?: string | null
  treatZeroPriceAsFree?: boolean
  variant?: 'compact' | 'marketing'
}

export function PlansGrid({
  billingInterval,
  className,
  currentPlanId,
  emptyState = PlansGridEmpty,
  gridClassName,
  intervalLabelStyle = 'abbreviated',
  onPlanSelect,
  plans,
  renderPlanFooter,
  selectedPlanId = null,
  treatZeroPriceAsFree = true,
  variant: plansVariant = 'compact',
}: PlansGridProps): ReactElement {
  const isSelectable = typeof onPlanSelect === 'function'
  const cardVariant = plansVariant === 'marketing' ? 'default' : 'compact'
  const isMarketing = plansVariant === 'marketing'

  if (plans.length === 0) {
    return <div className={className}>{emptyState()}</div>
  }

  return (
    <div className={className}>
      <div className={cn('grid gap-4 sm:grid-cols-3', gridClassName)}>
        {plans.map((plan, index) => {
          const priceCents = getPlanPriceCents({ billingInterval, plan })
          const isCurrent = currentPlanId === plan.id
          const isSelected = selectedPlanId === plan.id
          const footerContext: PlanFooterRenderContext = {
            billingInterval,
            isCurrent,
            isSelected,
            priceCents,
          }
          const price = formatPlanPrice(priceCents, {
            treatZeroAsFree: treatZeroPriceAsFree,
          })

          const footerContent = renderPlanFooter?.(plan, footerContext)

          const IconComponent = PLAN_CARDS_ICON_MAP[index]

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative overflow-hidden shadow-sm border',
                isMarketing && 'py-6',
                isSelectable &&
                  'cursor-pointer transition-colors hover:border-primary/50',
                isSelectable &&
                  isSelected &&
                  'border-primary ring-1 ring-primary',
                !isSelectable &&
                  isCurrent &&
                  'border-primary ring-1 ring-primary',
                !isSelectable &&
                  index === 1 &&
                  'border-primary ring-1 ring-primary',
              )}
              role={isSelectable ? 'button' : undefined}
              tabIndex={isSelectable ? 0 : undefined}
              variant={cardVariant}
              onClick={
                isSelectable
                  ? () => {
                      onPlanSelect(plan.id)
                    }
                  : undefined
              }
              onKeyDown={
                isSelectable
                  ? e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onPlanSelect(plan.id)
                      }
                    }
                  : undefined
              }
            >
              <CardContent
                className={cn(
                  'flex flex-1 flex-col',
                  isMarketing ? 'gap-6 px-6' : 'gap-4 px-4',
                )}
              >
                <div>
                  <div
                    className={cn(
                      'mb-2 flex items-center justify-between',
                      !isMarketing && 'mb-1.5',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CardTitle
                        className={cn(
                          'text-card-foreground font-semibold',
                          isMarketing ? 'text-2xl' : 'text-lg',
                        )}
                      >
                        {plan.name}
                      </CardTitle>
                      {isCurrent && <Badge variant="secondary">Current</Badge>}
                    </div>
                    <div
                      className={cn(
                        'bg-muted absolute -right-5 rounded-full [&>svg]:shrink-0 [&>svg]:stroke-1 z-1',
                        isMarketing
                          ? 'p-10 [&>svg]:size-12'
                          : 'p-7 [&>svg]:size-9',
                      )}
                    >
                      <IconComponent />
                    </div>
                  </div>
                  <CardDescription
                    className={cn(
                      'mb-4 z-10 relative',
                      !isMarketing && 'mb-3 text-xs',
                    )}
                  >
                    {plan.description}
                  </CardDescription>
                  <div className="flex gap-1">
                    {priceCents > 0 ? (
                      <span
                        className={cn(
                          'text-muted-foreground',
                          isMarketing ? 'text-lg' : 'text-base',
                        )}
                      >
                        $
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        'inline-block tabular-nums text-card-foreground font-bold',
                        isMarketing ? 'text-5xl' : 'text-3xl',
                      )}
                    >
                      {price}
                    </span>

                    {priceCents > 0 ? (
                      <p
                        className={cn(
                          'text-muted-foreground mt-auto',
                          isMarketing ? 'text-lg' : 'text-sm',
                        )}
                      >
                        {getIntervalSuffix({
                          billingInterval,
                          style: intervalLabelStyle,
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Separator />
                <div className="h-full flex-1">
                  <ul
                    className={cn(
                      'space-y-2',
                      isMarketing ? 'text-sm' : 'text-xs',
                    )}
                  >
                    {plan.features
                      .filter(pf => pf.isEnabled)
                      .map(pf => (
                        <li
                          key={pf.id}
                          className="flex items-center justify-between gap-2 sm:gap-3"
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
                </div>
              </CardContent>
              {footerContent !== null ? (
                <CardFooter>{footerContent}</CardFooter>
              ) : null}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
