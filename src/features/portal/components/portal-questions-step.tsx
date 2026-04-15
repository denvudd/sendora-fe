'use client'

import type { ChatbotQuestion } from '@prisma/client'
import type { ReactElement } from 'react'

import { saveSessionAnswersAction } from '@features/chatbot/actions/save-session-answers-action'
import { Button } from '@shared/components/ui/button'
import { Label } from '@shared/components/ui/label'
import { Textarea } from '@shared/components/ui/textarea'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

interface PortalQuestionsStepProps {
  portalToken: string
  questions: ChatbotQuestion[]
  defaultAnswers: Record<string, string>
  onComplete: (answers: Record<string, string>) => void
}

type FormValues = Record<string, string>

export function PortalQuestionsStep({
  portalToken,
  questions,
  defaultAnswers,
  onComplete,
}: PortalQuestionsStepProps): ReactElement {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: Object.fromEntries(
      questions.map(q => [q.id, defaultAnswers[q.id] ?? '']),
    ),
  })

  function onSubmit(values: FormValues): void {
    setError(undefined)

    startTransition(async () => {
      const result = await saveSessionAnswersAction(portalToken, values)

      if (!result.success) {
        setError(result.message ?? 'Something went wrong. Please try again.')

        return
      }

      onComplete(values)
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">A few questions first</h2>
        <p className="text-sm text-muted-foreground">
          Help us understand your needs before scheduling.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-1.5">
            <Label htmlFor={`q-${q.id}`}>
              {i + 1}. {q.text}
            </Label>
            <Textarea
              id={`q-${q.id}`}
              placeholder="Your answer…"
              rows={2}
              {...register(q.id)}
            />
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full sm:w-auto" disabled={isPending} type="submit">
          {isPending ? 'Saving…' : 'Continue to booking'}
        </Button>
      </form>
    </div>
  )
}
