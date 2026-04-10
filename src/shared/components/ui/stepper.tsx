'use client'

import type { Step } from '@stepperize/core'
import type { StepperPrimitives } from '@stepperize/react/primitives'
import type { ReactElement } from 'react'

import { cn } from '@shared/utils/cn'
import { Check } from 'lucide-react'
import { Fragment } from 'react'

interface StepWithTitle extends Step {
  title: string
}

/**
 * The subset of stepperize primitives used by StepperList.
 * Pass the `Stepper` object from `defineStepper` cast to this type.
 *
 * @example
 * primitives={Stepper as unknown as StepperListPrimitives}
 */
export type StepperListPrimitives = Pick<
  StepperPrimitives<Step[]>,
  'List' | 'Item' | 'Trigger' | 'Indicator' | 'Title' | 'Separator'
>

interface StepperListProps {
  /**
   * The live stepper state. Pass the `stepper` object from `useStepper()` or
   * the `Stepper.Root` render prop.
   */
  stepper: {
    state: {
      all: readonly StepWithTitle[]
      current: {
        index: number
        data: StepWithTitle
      }
    }
  }
  /**
   * The stepperize primitive components from `defineStepper`.
   * Requires a single cast at the call site:
   * `primitives={Stepper as unknown as StepperListPrimitives}`
   */
  primitives: StepperListPrimitives
  /** Return true to disable a step's trigger button. */
  isStepDisabled?: (stepId: string) => boolean
  className?: string
}

export function StepperList({
  stepper,
  primitives: { List, Item, Trigger, Indicator, Title, Separator },
  isStepDisabled,
  className,
}: StepperListProps): ReactElement {
  const { all, current } = stepper.state
  const currentId = current.data.id
  const currentIndex = current.index

  return (
    <List className={cn('flex w-full items-center gap-0', className)}>
      {all.map((step, index) => {
        const isActive = step.id === currentId
        const isDone = index < currentIndex

        return (
          <Fragment key={step.id}>
            <Item className="flex min-w-0 flex-1 flex-col gap-1" step={step.id}>
              <Trigger
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive &&
                    'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20',
                  isDone &&
                    !isActive &&
                    'border-green-500 bg-muted/30 text-foreground',
                  !isActive &&
                    !isDone &&
                    'border-border bg-muted/40 text-muted-foreground hover:bg-muted/60',
                )}
                disabled={isStepDisabled?.(step.id) ?? false}
              >
                <Indicator
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums transition-colors',
                    isActive &&
                      'border-primary bg-primary text-primary-foreground',
                    isDone &&
                      !isActive &&
                      'border-green-500 bg-green-500 text-primary-foreground',
                    !isActive &&
                      !isDone &&
                      'border-muted-foreground/40 bg-background text-muted-foreground',
                  )}
                >
                  {isDone && !isActive ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </Indicator>
                <span className="min-w-0 flex-1">
                  <Title className="truncate font-medium leading-none">
                    {step.title}
                  </Title>
                </span>
              </Trigger>
            </Item>
            {index < all.length - 1 ? (
              <Separator className="mx-1 hidden h-px min-w-[1rem] flex-1 bg-border sm:mx-2 sm:block" />
            ) : null}
          </Fragment>
        )
      })}
    </List>
  )
}
