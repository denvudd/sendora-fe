import type { ReactElement } from 'react'

import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'

interface PortalSuccessStepProps {
  booking: {
    startsAt: string
    endsAt: string
    timezone: string
  }
  hostname: string
  name: string
}

export function PortalSuccessStep({
  booking,
  hostname,
  name,
}: PortalSuccessStepProps): ReactElement {
  const { startsAt, endsAt, timezone } = booking
  const tzStart = new TZDate(new Date(startsAt), timezone)
  const tzEnd = new TZDate(new Date(endsAt), timezone)

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">You&apos;re booked!</h2>
        <p className="text-sm text-muted-foreground">
          Your appointment with{' '}
          <span className="font-medium text-foreground">{hostname}</span> has
          been confirmed.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-muted/40 px-6 py-4 text-left">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Guest
          </p>
          <p className="mt-0.5 font-medium">{name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Date
          </p>
          <p className="mt-0.5 font-medium">
            {format(tzStart, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Time
          </p>
          <p className="mt-0.5 font-medium">
            {format(tzStart, 'h:mm a')} – {format(tzEnd, 'h:mm a')}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        A team member from{' '}
        <span className="font-medium text-foreground">{hostname}</span> will be
        in touch to confirm details.
      </p>
    </div>
  )
}
