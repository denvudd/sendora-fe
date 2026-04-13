'use client'

import type { ChatbotQuestion } from '@prisma/client'
import type { ReactElement } from 'react'

import { updateChatbotQuestionsAction } from '@features/chatbot/actions/update-chatbot-questions-action'
import { chatbotQuestionsSchema } from '@features/chatbot/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { FieldError } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { MAX_GUIDING_QUESTIONS } from '../utils'

interface ChatbotQuestionsEditorProps {
  chatbotId: string
  domainId: string
  questions: ChatbotQuestion[]
}

interface FormValues {
  questions: { text: string }[]
}

export function ChatbotQuestionsEditor({
  chatbotId,
  domainId,
  questions,
}: ChatbotQuestionsEditorProps): ReactElement {
  const [isPending, startTransition] = useTransition()
  const [actionMessage, setActionMessage] = useState<string | undefined>()
  const [successVisible, setSuccessVisible] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    control,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(chatbotQuestionsSchema),
    defaultValues: {
      questions:
        questions.length > 0 ? questions.map(q => ({ text: q.text })) : [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()

    const values = getValues()
    const formData = new FormData()
    formData.set('questions', JSON.stringify(values.questions))

    startTransition(async () => {
      const result = await updateChatbotQuestionsAction(
        chatbotId,
        domainId,
        {},
        formData,
      )

      if (result.success) {
        setActionMessage(undefined)
        setSuccessVisible(true)
        setTimeout(() => setSuccessVisible(false), 3000)
      } else {
        setActionMessage(result.message)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guiding questions</CardTitle>
        <CardDescription>
          Questions the chatbot uses to guide visitors and understand their
          needs. These are also used in the portal form.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No questions yet. Add some to guide the conversation.
            </p>
          )}

          {fields.length > 0 && (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...register(`questions.${index}.text`)}
                    className="flex-1"
                    placeholder={`Question ${index + 1}`}
                  />
                  <Button
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove question</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.questions?.root?.message && (
            <FieldError>{errors.questions.root.message}</FieldError>
          )}

          {actionMessage && <FieldError>{actionMessage}</FieldError>}

          {successVisible && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Questions saved.
            </p>
          )}

          <div className="flex items-center gap-2">
            {fields.length < MAX_GUIDING_QUESTIONS && (
              <Button
                className="gap-2 mb-0"
                type="button"
                variant="secondary"
                onClick={() => append({ text: '' })}
              >
                <Plus />
                Add question
              </Button>
            )}

            <Button disabled={isPending} type="submit">
              {isPending ? 'Saving…' : 'Save questions'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
