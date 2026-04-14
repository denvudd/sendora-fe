'use client'

import type { ReactElement } from 'react'

import { TZDate } from '@date-fns/tz'
import { updateBookingStatusAction } from '@features/appointments/actions/update-booking-status-action'
import { BookingStatus } from '@prisma/client'
import { Badge } from '@shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table'
import { format } from 'date-fns'
import {
  Ban,
  CalendarClock,
  Check,
  ChevronDown,
  RotateCcw,
  UserX,
} from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

interface BookingWithLead {
  id: string
  title: string
  startsAt: Date
  endsAt: Date
  timezone: string
  status: BookingStatus
  lead: {
    email: string
    firstName: string | null
    lastName: string | null
  } | null
}

interface AppointmentsListProps {
  bookings: BookingWithLead[]
}

const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.NO_SHOW]: 'No show',
}

const STATUS_VARIANTS: Partial<
  Record<BookingStatus, 'default' | 'secondary' | 'outline' | 'destructive'>
> = {
  [BookingStatus.PENDING]: 'secondary',
  [BookingStatus.CONFIRMED]: 'default',
  [BookingStatus.CANCELLED]: 'destructive',
  [BookingStatus.NO_SHOW]: 'destructive',
}

// Allowed transitions per status
const TRANSITIONS: Partial<
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

function leadName(lead: BookingWithLead['lead']): string {
  if (!lead) {
    return 'Unknown'
  }

  const parts = [lead.firstName, lead.lastName].filter(Boolean)

  return parts.length > 0 ? parts.join(' ') : lead.email
}

interface StatusCellProps {
  booking: BookingWithLead
}

function StatusCell({ booking }: StatusCellProps): ReactElement {
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

export function AppointmentsList({
  bookings,
}: AppointmentsListProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming appointments</CardTitle>
        <CardDescription>
          Bookings made through your chatbot portal.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <CalendarClock className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No upcoming appointments yet. They will appear here when visitors
              book through the portal.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(booking => {
                const durationMin = Math.round(
                  (booking.endsAt.getTime() - booking.startsAt.getTime()) /
                    60000,
                )

                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{leadName(booking.lead)}</p>
                        {booking.lead && (
                          <p className="text-xs text-muted-foreground">
                            {booking.lead.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(
                        new TZDate(booking.startsAt, booking.timezone),
                        'MMM d, yyyy',
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(
                        new TZDate(booking.startsAt, booking.timezone),
                        'h:mm a',
                      )}{' '}
                      –{' '}
                      {format(
                        new TZDate(booking.endsAt, booking.timezone),
                        'h:mm a',
                      )}
                    </TableCell>
                    <TableCell>{durationMin} min</TableCell>
                    <TableCell>
                      <StatusCell booking={booking} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
