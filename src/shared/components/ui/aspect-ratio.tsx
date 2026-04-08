import type { ComponentProps, CSSProperties } from 'react'

import { cn } from '@shared/utils/cn'

function AspectRatio({
  ratio,
  className,
  ...props
}: ComponentProps<'div'> & { ratio: number }) {
  return (
    <div
      className={cn('relative aspect-(--ratio)', className)}
      data-slot="aspect-ratio"
      style={
        {
          '--ratio': ratio,
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { AspectRatio }
