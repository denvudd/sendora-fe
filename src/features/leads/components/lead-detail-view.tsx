import type { LeadStatus } from '@prisma/client'
import type { ReactElement } from 'react'

import { TZDate } from '@date-fns/tz'
import { LeadNotesForm } from '@features/leads/components/lead-notes-form'
import { LeadStatusSelect } from '@features/leads/components/lead-status-select'
import { BookingStatus } from '@prisma/client'
import { Badge } from '@shared/components/ui/badge'
import { Button, buttonVariants } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { Separator } from '@shared/components/ui/separator'
import { ROUTES } from '@shared/constants/routes'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/shared/utils/cn'

import { leadDisplayName } from '../utils'

interface Booking {
  id: string
  title: string
  startsAt: Date
  endsAt: Date
  timezone: string
  status: BookingStatus
  meetingLink: string | null
}

interface Session {
  id: string
  sessionUuid: string
  status: string
  createdAt: Date
  chatbot: {
    domain: { hostname: string }
  }
}

interface QuestionnaireAnswer {
  question: string
  answer: string
}

interface LeadDetailViewProps {
  lead: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    source: string | null
    status: LeadStatus
    notes: string | null
    metadata: unknown
    createdAt: Date
    sessions: Session[]
    bookings: Booking[]
  }
}

function parseQuestionnaireAnswers(
  metadata: unknown,
): QuestionnaireAnswer[] | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  const meta = metadata as Record<string, unknown>
  const raw = meta.questionnaireAnswers

  if (!Array.isArray(raw) || raw.length === 0) {
    return null
  }

  const answers = raw.filter(
    (item): item is QuestionnaireAnswer =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).question === 'string' &&
      typeof (item as Record<string, unknown>).answer === 'string',
  )

  return answers.length > 0 ? answers : null
}

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.COMPLETED]: 'Completed',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.NO_SHOW]: 'No show',
}

const BOOKING_STATUS_VARIANTS: Record<
  BookingStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  [BookingStatus.PENDING]: 'secondary',
  [BookingStatus.CONFIRMED]: 'default',
  [BookingStatus.COMPLETED]: 'default',
  [BookingStatus.CANCELLED]: 'destructive',
  [BookingStatus.NO_SHOW]: 'destructive',
}

export function LeadDetailView({ lead }: LeadDetailViewProps): ReactElement {
  const name = leadDisplayName(lead)
  const primarySession = lead.sessions[0]
  const questionnaireAnswers = parseQuestionnaireAnswers(lead.metadata)

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start gap-4">
        <Button
          render={<Link href={ROUTES.Leads} />}
          size="sm"
          variant="outline"
        >
          <ArrowLeft className="mr-1.5 size-3.5" />
          All leads
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted-foreground">
            Lead since {format(new Date(lead.createdAt), 'MMM d, yyyy hh:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeadStatusSelect leadId={lead.id} status={lead.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — contact info + notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <a
                  className="text-foreground hover:underline"
                  href={`mailto:${lead.email}`}
                >
                  {lead.email}
                </a>
              </div>

              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}

              {primarySession && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Source:</span>
                  <span>{primarySession.chatbot.domain.hostname}</span>
                </div>
              )}

              {!primarySession && lead.source && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Source:</span>
                  <span>{lead.source}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questionnaire answers */}
          {questionnaireAnswers && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="size-4 text-muted-foreground" />
                  Questionnaire answers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questionnaireAnswers.map((item, i) => (
                  <div key={item.question} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.question}
                    </p>
                    <p className="text-sm">{item.answer}</p>
                    {i < questionnaireAnswers.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadNotesForm initialNotes={lead.notes} leadId={lead.id} />
            </CardContent>
          </Card>
        </div>

        {/* Right column — bookings + conversation */}
        <div className="space-y-6">
          {/* Conversations */}
          {lead.sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lead.sessions.map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {session.chatbot.domain.hostname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button
                      render={
                        <Link
                          href={`${ROUTES.Conversations}?session=${session.id}`}
                        />
                      }
                      size="sm"
                      variant="outline"
                    >
                      <MessageSquare className="mr-1.5 size-3.5" />
                      View
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <Calendar className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No bookings yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lead.bookings.map((booking, i) => (
                    <div key={booking.id}>
                      {i > 0 && <Separator className="my-3" />}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{booking.title}</p>
                          <Badge
                            variant={BOOKING_STATUS_VARIANTS[booking.status]}
                          >
                            {BOOKING_STATUS_LABELS[booking.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 justify-between">
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new TZDate(booking.startsAt, booking.timezone),
                              'MMM d, yyyy',
                            )}{' '}
                            ·{' '}
                            {format(
                              new TZDate(booking.startsAt, booking.timezone),
                              'h:mm a',
                            )}{' '}
                            –{' '}
                            {format(
                              new TZDate(booking.endsAt, booking.timezone),
                              'h:mm a',
                            )}
                          </p>
                          {booking.meetingLink && (
                            <Link
                              className={cn(
                                buttonVariants({
                                  variant: 'link',
                                }),
                                'p-0 text-xs text-muted-foreground',
                              )}
                              href={booking.meetingLink}
                              target="_blank"
                            >
                              {booking.meetingLink}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
