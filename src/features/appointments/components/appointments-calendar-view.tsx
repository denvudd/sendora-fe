'use client'

import type { ReactElement } from 'react'

import { TZDate } from '@date-fns/tz'
import { updateBookingStatusAction } from '@features/appointments/actions/update-booking-status-action'
import {
  AppointmentStatus,
  TRANSITIONS,
} from '@features/appointments/components/appointment-status'
import { ConfirmBookingDialog } from '@features/appointments/components/confirm-booking-dialog'
import { leadName, type BookingWithLead } from '@features/appointments/utils'
import { BookingStatus } from '@prisma/client'
import { Button } from '@shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/components/ui/tooltip'
import { cn } from '@shared/utils/cn'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_CHIP_CLASSES: Partial<Record<BookingStatus, string>> = {
  [BookingStatus.PENDING]: 'bg-secondary text-secondary-foreground',
  [BookingStatus.CONFIRMED]: 'bg-primary text-primary-foreground',
  [BookingStatus.CANCELLED]: 'bg-destructive/15 text-destructive',
  [BookingStatus.NO_SHOW]: 'bg-destructive/15 text-destructive',
}

const MAX_CHIPS_PER_CELL = 3

interface CalendarBookingChipProps {
  booking: BookingWithLead
  googleCalendarEnabled: boolean
}

function CalendarBookingChip({
  booking,
  googleCalendarEnabled,
}: CalendarBookingChipProps): ReactElement {
  const [isPending, startTransition] = useTransition()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const timeLabel = format(
    new TZDate(booking.startsAt, booking.timezone),
    'h:mm a',
  )
  const endTimeLabel = format(
    new TZDate(booking.endsAt, booking.timezone),
    'h:mm a',
  )
  const durationMin = Math.round(
    (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000,
  )
  const name = leadName(booking.lead)
  const email = booking.lead?.email
  const chipClass =
    STATUS_CHIP_CLASSES[booking.status] ?? 'bg-muted text-muted-foreground'
  const transitions = TRANSITIONS[booking.status] ?? []

  function handleTransition(status: BookingStatus): void {
    if (status === BookingStatus.CONFIRMED) {
      setConfirmDialogOpen(true)

      return
    }

    startTransition(async () => {
      const result = await updateBookingStatusAction(booking.id, status)

      if (!result.success) {
        toast.error(result.message ?? 'Failed to update status.')
      }
    })
  }

  const chipContent = (
    <span className="truncate">
      {isPending ? 'Saving…' : `${name} — ${timeLabel}`}
    </span>
  )

  const tooltipBody = (
    <div className="space-y-1">
      <p>{name}</p>
      {email && <p>{email}</p>}
      <p className="text-primary">
        {timeLabel} – {endTimeLabel} · {durationMin} min
      </p>
      {booking.meetingLink && (
        <a
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          href={booking.meetingLink}
          rel="noopener noreferrer"
          target="_blank"
          onClick={e => e.stopPropagation()}
        >
          <Video className="size-3 shrink-0" />
          Join meeting
        </a>
      )}
      <AppointmentStatus
        booking={booking}
        googleCalendarEnabled={googleCalendarEnabled}
      />
    </div>
  )

  const baseChipClass = cn(
    'flex w-full items-center truncate rounded px-1 py-0.5 text-[10px] leading-tight transition-opacity',
    chipClass,
    isPending && 'opacity-60',
  )

  return (
    <>
      <TooltipProvider delay={400}>
        <Tooltip>
          {transitions.length > 0 ? (
            <DropdownMenu>
              <TooltipTrigger>
                <DropdownMenuTrigger
                  className={cn(
                    baseChipClass,
                    'cursor-pointer hover:opacity-80',
                  )}
                  disabled={isPending}
                >
                  {chipContent}
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <DropdownMenuContent align="start">
                {transitions.map((t, i) => (
                  <>
                    {i > 0 && t.status === BookingStatus.CANCELLED && (
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
          ) : (
            <TooltipTrigger
              render={<div className={cn(baseChipClass, 'cursor-default')} />}
            >
              {chipContent}
            </TooltipTrigger>
          )}
          <TooltipContent className="max-w-[220px]" side="top">
            {tooltipBody}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ConfirmBookingDialog
        bookingId={booking.id}
        googleCalendarEnabled={googleCalendarEnabled}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
      />
    </>
  )
}

interface AppointmentsCalendarViewProps {
  bookings: BookingWithLead[]
  googleCalendarEnabled: boolean
}

export function AppointmentsCalendarView({
  bookings,
  googleCalendarEnabled,
}: AppointmentsCalendarViewProps): ReactElement {
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  )

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingWithLead[]>()

    for (const booking of bookings) {
      const key = format(
        new TZDate(booking.startsAt, booking.timezone),
        'yyyy-MM-dd',
      )
      const existing = map.get(key) ?? []
      map.set(key, [...existing, booking])
    }

    return map
  }, [bookings])

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })

    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const monthLabel = format(currentMonth, 'MMMM yyyy')

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          aria-label="Previous month"
          size="icon"
          variant="outline"
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <Button
          aria-label="Next month"
          size="icon"
          variant="outline"
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Scrollable calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAY_LABELS.map(label => (
              <div
                key={label}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {gridDays.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const dayBookings = bookingsByDay.get(key) ?? []
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isTodayDate = isToday(day)
              const visibleBookings = dayBookings.slice(0, MAX_CHIPS_PER_CELL)
              const overflowCount = dayBookings.length - visibleBookings.length

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-[90px] border-b border-r border-border p-1.5 sm:min-h-[110px]',
                    !isCurrentMonth && 'bg-muted/30',
                    isTodayDate && 'bg-primary/5',
                    '[&:nth-child(7n)]:border-r-0',
                  )}
                >
                  {/* Day number */}
                  <div className="mb-1">
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                        isTodayDate && 'bg-primary text-primary-foreground',
                        !isCurrentMonth && 'text-muted-foreground',
                        !isTodayDate && isCurrentMonth && 'text-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Booking chips */}
                  <div className="flex flex-col gap-0.5">
                    {visibleBookings.map(booking => (
                      <CalendarBookingChip
                        key={booking.id}
                        booking={booking}
                        googleCalendarEnabled={googleCalendarEnabled}
                      />
                    ))}

                    {overflowCount > 0 && (
                      <span className="pl-0.5 text-[10px] text-muted-foreground">
                        +{overflowCount} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
