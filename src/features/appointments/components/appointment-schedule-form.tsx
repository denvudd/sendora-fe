'use client'

import type { AppointmentSchedule } from '@prisma/client'
import type { ReactElement } from 'react'

import { saveScheduleAction } from '@features/appointments/actions/save-schedule-action'
import {
  scheduleFormSchema,
  type ScheduleFormValues,
} from '@features/appointments/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Switch } from '@shared/components/ui/switch'
import { cn } from '@shared/utils/cn'
import { useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const WEEKDAYS = [
  { key: '1', label: 'Monday' },
  { key: '2', label: 'Tuesday' },
  { key: '3', label: 'Wednesday' },
  { key: '4', label: 'Thursday' },
  { key: '5', label: 'Friday' },
  { key: '6', label: 'Saturday' },
  { key: '7', label: 'Sunday' },
] as const

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris / Berlin' },
  { value: 'Europe/Helsinki', label: 'Helsinki / Kyiv' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India' },
  { value: 'Asia/Bangkok', label: 'Bangkok' },
  { value: 'Asia/Shanghai', label: 'China' },
  { value: 'Asia/Tokyo', label: 'Japan' },
  { value: 'Australia/Sydney', label: 'Sydney' },
] as const

const SLOT_DURATIONS = [15, 30, 45, 60, 90, 120] as const
const BUFFER_OPTIONS = [0, 5, 10, 15, 30] as const

function parseExistingSchedule(raw: unknown): Record<string, string[]> {
  const base: Record<string, string[]> = {}

  for (const { key } of WEEKDAYS) {
    base[key] = []
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      if (/^[1-7]$/.test(k) && Array.isArray(v)) {
        base[k] = v.filter((item): item is string => typeof item === 'string')
      }
    }
  }

  return base
}

function parseRange(range: string): [string, string] {
  const [s, e] = range.split('-')

  return [s ?? '09:00', e ?? '17:00']
}

interface AppointmentScheduleFormProps {
  schedule: AppointmentSchedule | null
}

export function AppointmentScheduleForm({
  schedule,
}: AppointmentScheduleFormProps): ReactElement {
  const [isPending, startTransition] = useTransition()

  const existingSchedule = parseExistingSchedule(schedule?.schedule)

  const defaultEnabledDays: Record<string, boolean> = {}
  const defaultStartTimes: Record<string, string> = {}
  const defaultEndTimes: Record<string, string> = {}

  for (const { key } of WEEKDAYS) {
    const ranges = existingSchedule[key]
    defaultEnabledDays[key] = ranges.length > 0
    const [s, e] =
      ranges.length > 0 ? parseRange(ranges[0]) : ['09:00', '17:00']
    defaultStartTimes[key] = s
    defaultEndTimes[key] = e
  }

  const { control, handleSubmit, watch, setValue, register } =
    useForm<ScheduleFormValues>({
      resolver: zodResolver(scheduleFormSchema),
      defaultValues: {
        isEnabled: schedule?.isEnabled ?? true,
        slotDuration: schedule?.slotDuration ?? 60,
        bufferMinutes: schedule?.bufferMinutes ?? 0,
        timezone: schedule?.timezone ?? 'UTC',
        schedule: existingSchedule,
        enabledDays: defaultEnabledDays,
        startTimes: defaultStartTimes,
        endTimes: defaultEndTimes,
      },
    })

  const enabledDays = watch('enabledDays')

  function onSubmit(values: ScheduleFormValues): void {
    const builtSchedule: Record<string, string[]> = {}

    for (const { key } of WEEKDAYS) {
      if (values.enabledDays[key]) {
        const s = values.startTimes[key] ?? '09:00'
        const e = values.endTimes[key] ?? '17:00'
        builtSchedule[key] = [`${s}-${e}`]
      } else {
        builtSchedule[key] = []
      }
    }

    startTransition(async () => {
      const result = await saveScheduleAction({
        isEnabled: values.isEnabled,
        slotDuration: values.slotDuration,
        bufferMinutes: values.bufferMinutes,
        timezone: values.timezone,
        schedule: builtSchedule,
      })

      if (result.success) {
        toast.success('Schedule saved.')
      } else {
        toast.error(result.message ?? 'Something went wrong.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability schedule</CardTitle>
        <CardDescription>
          Configure when visitors can book appointments through the portal.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="isEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  id="isEnabled"
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isEnabled">Enable appointment booking</Label>
          </div>

          <div className="flex md:items-center flex-col md:flex-row gap-2 md:gap-4 w-full">
            <div className="space-y-1.5">
              <Label htmlFor="slotDuration">Slot duration</Label>
              <Select
                value={watch('slotDuration')}
                onValueChange={value => setValue('slotDuration', Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a slot duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Slot durations</SelectLabel>
                    {SLOT_DURATIONS.map(d => (
                      <SelectItem key={d} value={d}>
                        {d} min
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bufferMinutes">Buffer between slots</Label>
              <Select
                value={
                  watch('bufferMinutes') === 0
                    ? 'No buffer'
                    : `${watch('bufferMinutes')} min`
                }
                onValueChange={value =>
                  setValue('bufferMinutes', Number(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a buffer duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Buffer durations</SelectLabel>
                    {BUFFER_OPTIONS.map(b => (
                      <SelectItem key={b} value={b}>
                        {b === 0 ? 'No buffer' : `${b} min`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={watch('timezone')}
                onValueChange={value => setValue('timezone', value ?? 'UTC')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Timezones</SelectLabel>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weekly schedule */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Weekly schedule</Label>
            <div className="divide-y divide-border rounded-lg border border-border">
              {WEEKDAYS.map(({ key, label }) => {
                const isEnabled = enabledDays[key]

                return (
                  <div key={key} className="flex items-center gap-4 px-4 py-3">
                    <Controller
                      control={control}
                      name={`enabledDays.${key}`}
                      render={({ field }) => (
                        <Checkbox
                          checked={!!field.value}
                          id={`day-${key}`}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label
                      className={cn(
                        'w-24 cursor-pointer',
                        !isEnabled && 'text-muted-foreground',
                      )}
                      htmlFor={`day-${key}`}
                    >
                      {label}
                    </Label>
                    {isEnabled ? (
                      <div className="ml-auto flex items-center gap-2">
                        <Input
                          className="w-28"
                          type="time"
                          {...register(`startTimes.${key}`)}
                        />
                        <span className="text-sm text-muted-foreground">–</span>
                        <Input
                          className="w-28"
                          type="time"
                          {...register(`endTimes.${key}`)}
                        />
                      </div>
                    ) : (
                      <span className="ml-auto text-sm text-muted-foreground">
                        Unavailable
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Button disabled={isPending} type="submit">
            {isPending ? 'Saving…' : 'Save schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
