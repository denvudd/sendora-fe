'use client'

import type { AppointmentSchedule, ChatbotQuestion } from '@prisma/client'
import type { ReactElement } from 'react'

import { useState } from 'react'

import { PortalBookingStep } from './portal-booking-step'
import { PortalQuestionsStep } from './portal-questions-step'
import { PortalSuccessStep } from './portal-success-step'

type Step = 'questions' | 'booking' | 'success'

interface BookingResult {
  booking: {
    startsAt: string
    endsAt: string
    timezone: string
  }
  name: string
}

interface PortalBookingFlowProps {
  portalToken: string
  hostname: string
  questions: ChatbotQuestion[]
  defaultAnswers: Record<string, string>
  schedule: AppointmentSchedule | null
}

export function PortalBookingFlow({
  portalToken,
  hostname,
  questions,
  defaultAnswers,
  schedule,
}: PortalBookingFlowProps): ReactElement {
  const initialStep: Step = questions.length > 0 ? 'questions' : 'booking'
  const [step, setStep] = useState<Step>(initialStep)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-sm">
      {/* Branding */}
      <div className="mb-6 flex items-center gap-2">
        <div className="size-2 rounded-full bg-primary" />
        <p className="text-sm font-medium text-muted-foreground">{hostname}</p>
      </div>

      {step === 'questions' && (
        <PortalQuestionsStep
          defaultAnswers={defaultAnswers}
          portalToken={portalToken}
          questions={questions}
          onComplete={() => setStep('booking')}
        />
      )}

      {step === 'booking' && (
        <PortalBookingStep
          hostname={hostname}
          portalToken={portalToken}
          schedule={schedule}
          onComplete={result => {
            setBookingResult(result)
            setStep('success')
          }}
        />
      )}

      {step === 'success' && bookingResult && (
        <PortalSuccessStep
          booking={bookingResult.booking}
          hostname={hostname}
          name={bookingResult.name}
        />
      )}
    </div>
  )
}
