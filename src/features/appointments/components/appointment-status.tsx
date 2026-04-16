'use client'

import type { BookingWithLead } from '../utils'

import { BookingStatus } from '@prisma/client'
import { Ban, Check, ChevronDown, RotateCcw, UserX } from 'lucide-react'
import { useTransition, type ReactElement } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

import { updateBookingStatusAction } from '../actions/update-booking-status-action'

interface AppointmentStatusProps {
  booking: BookingWithLead
}

// Allowed transitions per status
export const TRANSITIONS: Partial<
  Record<
    BookingStatus,
    Array<{
      status: BookingStatus
      label: string
      icon: ReactElement
    }>
  >
> = {
  [BookingStatus.PENDING]: [
    {
      status: BookingStatus.CONFIRMED,
      label: 'Confirm',
      icon: <Check className="size-4" />,
    },
    {
      status: BookingStatus.CANCELLED,
      label: 'Cancel',
      icon: <Ban className="size-4" />,
    },
  ],
  [BookingStatus.CONFIRMED]: [
    {
      status: BookingStatus.PENDING,
      label: 'Revert to pending',
      icon: <RotateCcw className="size-4" />,
    },
    {
      status: BookingStatus.NO_SHOW,
      label: 'Mark as no-show',
      icon: <UserX className="size-4" />,
    },
    {
      status: BookingStatus.CANCELLED,
      label: 'Cancel',
      icon: <Ban className="size-4" />,
    },
  ],
  [BookingStatus.NO_SHOW]: [
    {
      status: BookingStatus.CONFIRMED,
      label: 'Revert to confirmed',
      icon: <RotateCcw className="size-4" />,
    },
  ],
  [BookingStatus.CANCELLED]: [
    {
      status: BookingStatus.PENDING,
      label: 'Reopen',
      icon: <RotateCcw className="size-4" />,
    },
  ],
}

export const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.NO_SHOW]: 'No show',
}

export const STATUS_VARIANTS: Partial<
  Record<BookingStatus, 'default' | 'secondary' | 'outline' | 'destructive'>
> = {
  [BookingStatus.PENDING]: 'secondary',
  [BookingStatus.CONFIRMED]: 'default',
  [BookingStatus.CANCELLED]: 'destructive',
  [BookingStatus.NO_SHOW]: 'destructive',
}

export function AppointmentStatus({
  booking,
}: AppointmentStatusProps): ReactElement {
  const [isPending, startTransition] = useTransition()
  const transitions = TRANSITIONS[booking.status] ?? []
  const label = STATUS_LABELS[booking.status] ?? booking.status
  const variant = STATUS_VARIANTS[booking.status] ?? 'outline'

  function handleTransition(status: BookingStatus): void {
    startTransition(async () => {
      const result = await updateBookingStatusAction(booking.id, status)

      if (!result.success) {
        toast.error(result.message ?? 'Failed to update status.')
      }
    })
  }

  if (transitions.length === 0) {
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={isPending}
      >
        <Badge className="cursor-pointer select-none" variant={variant}>
          {isPending ? 'Saving…' : label}
          <ChevronDown className="ml-1 size-3 opacity-60" />
        </Badge>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {transitions.map((t, i) => (
          <>
            {i > 0 && t.status === 'CANCELLED' && (
              <DropdownMenuSeparator key={`sep-${t.status}`} />
            )}
            <DropdownMenuItem
              key={t.status}
              className="gap-2"
              onClick={() => handleTransition(t.status)}
            >
              {t.icon}
              {t.label}
            </DropdownMenuItem>
          </>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
