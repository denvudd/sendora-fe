import { z } from 'zod'

const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM')

function isValidTime(t: string): boolean {
  const [h, m] = t.split(':').map(Number)

  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

const timeRangeString = z
  .string()
  .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Time range must be HH:MM-HH:MM')
  .refine(val => {
    const [start, end] = val.split('-')

    return isValidTime(start) && isValidTime(end)
  }, 'Invalid time values')
  .refine(val => {
    const [start, end] = val.split('-')
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)

    return sh * 60 + sm < eh * 60 + em
  }, 'End time must be after start time')

const scheduleRecord = z.record(
  z.string().regex(/^[1-7]$/),
  z.array(timeRangeString),
)

// Server-side schema — uses coerce for form-data compat
export const scheduleSchema = z.object({
  isEnabled: z.boolean(),
  slotDuration: z.coerce.number().int().min(15).max(240),
  bufferMinutes: z.coerce.number().int().min(0).max(60),
  timezone: z.string().min(1),
  schedule: scheduleRecord,
})

export type ScheduleInput = z.infer<typeof scheduleSchema>

// Client-side form schema — uses plain number (RHF gives typed values)
export const scheduleFormSchema = z.object({
  isEnabled: z.boolean(),
  slotDuration: z.number().int().min(15).max(240),
  bufferMinutes: z.number().int().min(0).max(60),
  timezone: z.string().min(1),
  schedule: scheduleRecord,
  enabledDays: z.record(z.string().regex(/^[1-7]$/), z.boolean()),
  startTimes: z.record(z.string().regex(/^[1-7]$/), timeString),
  endTimes: z.record(z.string().regex(/^[1-7]$/), timeString),
})

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

export const bookingSchema = z.object({
  portalToken: z.string().min(1),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  timezone: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.email('Enter a valid email'),
})

export type BookingInput = z.infer<typeof bookingSchema>

export const answersSchema = z.object({
  portalToken: z.string().min(1),
  answers: z.record(z.string(), z.string()),
})

export type AnswersInput = z.infer<typeof answersSchema>
