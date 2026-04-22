'use client'

import type { ReactElement } from 'react'

import { TZDate } from '@date-fns/tz'
import { AppointmentStatus } from '@features/appointments/components/appointment-status'
import { AppointmentsCalendarView } from '@features/appointments/components/appointments-calendar-view'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@shared/components/ui/toggle-group'
import { format } from 'date-fns'
import { CalendarClock, CalendarDays, List, Video } from 'lucide-react'
import { useState } from 'react'

import { leadName, type BookingWithLead } from '../utils'

interface AppointmentsListProps {
  bookings: BookingWithLead[]
  googleCalendarEnabled: boolean
}

export function AppointmentsList({
  bookings,
  googleCalendarEnabled,
}: AppointmentsListProps): ReactElement {
  const [view, setView] = useState<'table' | 'calendar'>('table')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming appointments</CardTitle>
        <CardDescription>
          Bookings made through your chatbot portal.
        </CardDescription>
        <CardAction>
          <ToggleGroup
            size="sm"
            value={[view]}
            variant="outline"
            onValueChange={(values: string[]) => {
              const v = values[0]

              if (v === 'table' || v === 'calendar') {
                setView(v)
              }
            }}
          >
            <ToggleGroupItem aria-label="List view" value="table">
              <List className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Calendar view" value="calendar">
              <CalendarDays className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>

      <CardContent>
        {view === 'calendar' ? (
          <AppointmentsCalendarView
            bookings={bookings}
            googleCalendarEnabled={googleCalendarEnabled}
          />
        ) : bookings.length === 0 ? (
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
                <TableHead>Meeting</TableHead>
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
                      {booking.meetingLink ? (
                        <a
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                          href={booking.meetingLink}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <Video className="size-3.5 shrink-0" />
                          Join
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AppointmentStatus
                        booking={booking}
                        googleCalendarEnabled={googleCalendarEnabled}
                      />
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
