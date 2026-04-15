'use client'

import type { AppointmentSchedule } from '@prisma/client'
import type { ReactElement } from 'react'

import { bookAppointmentAction } from '@features/appointments/actions/book-appointment-action'
import {
  getAvailableSlotsAction,
  type AvailableSlot,
} from '@features/appointments/actions/get-available-slots-action'
import { Button } from '@shared/components/ui/button'
import { Calendar } from '@shared/components/ui/calendar'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Skeleton } from '@shared/components/ui/skeleton'
import { cn } from '@shared/utils/cn'
import { format, getISODay, isBefore, startOfDay } from 'date-fns'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

interface PortalBookingStepProps {
  portalToken: string
  hostname: string
  schedule: AppointmentSchedule | null
  onComplete: (result: {
    booking: { startsAt: string; endsAt: string; timezone: string }
    name: string
  }) => void
}

interface ContactFormValues {
  name: string
  email: string
}

function getEnabledDays(schedule: AppointmentSchedule | null): Set<number> {
  if (!schedule) {
    return new Set()
  }

  const raw = schedule.schedule as Record<string, string[]>
  const enabled = new Set<number>()

  for (const [k, v] of Object.entries(raw)) {
    if (v.length > 0) {
      enabled.add(Number(k))
    }
  }

  return enabled
}

export function PortalBookingStep({
  portalToken,
  hostname,
  schedule,
  onComplete,
}: PortalBookingStepProps): ReactElement {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const enabledDays = getEnabledDays(schedule)
  const timezone = schedule?.timezone ?? 'UTC'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>()

  useEffect(() => {
    if (!selectedDate || !slotsLoading) {
      return
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    getAvailableSlotsAction(portalToken, dateStr)
      .then(s => setSlots(s))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, portalToken, slotsLoading])

  function handleDateSelect(date: Date | undefined): void {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlots([])

    if (date) {
      setSlotsLoading(true)
    }
  }

  function isDayDisabled(day: Date): boolean {
    if (isBefore(startOfDay(day), startOfDay(new Date()))) {
      return true
    }

    const isoDay = getISODay(day)

    return !enabledDays.has(isoDay)
  }

  function onSubmit(values: ContactFormValues): void {
    if (!selectedSlot) {
      return
    }

    setSubmitError(undefined)

    startTransition(async () => {
      const result = await bookAppointmentAction({
        portalToken,
        startsAt: selectedSlot.startsAt,
        endsAt: selectedSlot.endsAt,
        timezone,
        name: values.name,
        email: values.email,
      })

      if (result.success && result.booking) {
        onComplete({ booking: result.booking, name: values.name })
      } else {
        setSubmitError(result.message ?? 'Something went wrong.')
      }
    })
  }

  const hasSchedule =
    schedule !== null && schedule.isEnabled && enabledDays.size > 0

  if (!hasSchedule) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-muted-foreground">
          Online booking isn&apos;t available yet for{' '}
          <span className="font-medium text-foreground">{hostname}</span>. A
          team member will follow up with you shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Choose a time</h2>
        <p className="text-sm text-muted-foreground">
          Select a date and available slot for your appointment.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Calendar */}
        <div className="self-start rounded-lg border border-border p-2">
          <Calendar
            disabled={isDayDisabled}
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
          />
        </div>

        {/* Time slots */}
        <div className="flex-1 space-y-3">
          {!selectedDate && (
            <p className="py-4 text-sm text-muted-foreground">
              Select a date on the calendar to see available time slots.
            </p>
          )}

          {selectedDate && slotsLoading && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton
                  key={`slot-skeleton-${i}`}
                  className="h-10 rounded-lg"
                />
              ))}
            </div>
          )}

          {selectedDate && !slotsLoading && slots.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              No available slots for {format(selectedDate, 'MMMM d')}. Please
              pick another date.
            </p>
          )}

          {selectedDate && !slotsLoading && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map(slot => (
                <button
                  key={slot.startsAt}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors',
                    selectedSlot?.startsAt === slot.startsAt
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-muted',
                  )}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact form — shown once a slot is selected */}
      {selectedSlot && selectedDate && (
        <form
          className="space-y-5 border-t border-border pt-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <h3 className="font-medium">Your details</h3>
            <p className="text-sm text-muted-foreground">
              Booking for{' '}
              <span className="font-medium text-foreground">
                {format(selectedDate, 'MMMM d')} at {selectedSlot.label}
              </span>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                {...register('name', { required: 'Name is required' })}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                placeholder="jane@example.com"
                type="email"
                {...register('email', { required: 'Email is required' })}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button
            className="w-full sm:w-auto"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Booking…' : 'Confirm appointment'}
          </Button>
        </form>
      )}
    </div>
  )
}
