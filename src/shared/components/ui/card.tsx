import type { ComponentProps } from 'react'

import { cn } from '@shared/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  `
    group/card flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground
    ring-1 ring-foreground/10
    has-data-[slot=card-footer]:pb-0
    has-[>img:first-child]:pt-0
    *:[img:first-child]:rounded-t-xl
    *:[img:last-child]:rounded-b-xl
  `,
  {
    variants: {
      variant: {
        default: `
          gap-4 py-4 text-sm
        `,
        compact: `
          gap-3 rounded-lg py-3 text-xs
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Card({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <div
      className={cn(cardVariants({ variant }), className)}
      data-slot="card"
      data-variant={variant}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          group/card-header @container/card-header grid auto-rows-min
          items-start gap-1 rounded-t-xl px-4
          group-data-[variant=compact]/card:px-3
          has-data-[slot=card-action]:grid-cols-[1fr_auto]
          has-data-[slot=card-description]:grid-rows-[auto_auto]
          [.border-b]:pb-4
          group-data-[variant=compact]/card:[.border-b]:pb-3
        `,
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          font-heading text-base/snug font-medium
          group-data-[variant=compact]/card:text-sm
        `,
        className,
      )}
      data-slot="card-title"
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          text-sm text-muted-foreground
          group-data-[variant=compact]/card:text-xs
        `,
        className,
      )}
      data-slot="card-description"
      {...props}
    />
  )
}

function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      data-slot="card-action"
      {...props}
    />
  )
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          px-4
          group-data-[variant=compact]/card:px-3
        `,
        className,
      )}
      data-slot="card-content"
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          flex items-center rounded-b-xl border-t bg-muted/50 p-4
          group-data-[variant=compact]/card:p-3
        `,
        className,
      )}
      data-slot="card-footer"
      {...props}
    />
  )
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
