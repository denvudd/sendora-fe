import type { BookingWithLead } from '@features/appointments/utils'
import type { ReactElement } from 'react'

import { TZDate } from '@date-fns/tz'
import { leadName } from '@features/appointments/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { format } from 'date-fns'
import { CalendarClock } from 'lucide-react'
import Link from 'next/link'

import { AppointmentStatus } from '@/features/appointments/components/appointment-status'
import { ROUTES } from '@/shared/constants/routes'

interface UpcomingBookingsListProps {
  bookings: BookingWithLead[]
}

export function UpcomingBookingsList({
  bookings,
}: UpcomingBookingsListProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
        <CardDescription>Next scheduled bookings</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <CalendarClock className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No upcoming appointments.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.map(booking => {
              const tzStart = new TZDate(booking.startsAt, booking.timezone)

              return (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {leadName(booking.lead)}
                    </p>
                    {booking.lead && (
                      <p className="truncate text-xs text-muted-foreground">
                        {booking.lead.email}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {format(tzStart, 'MMM d, yyyy h:mm a')}
                    </p>
                    <AppointmentStatus booking={booking} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          href={ROUTES.Appointments}
        >
          View all appointments →
        </Link>
      </CardFooter>
    </Card>
  )
}
