'use client'

import type { ReactElement } from 'react'

import { createChatbotAction } from '@features/chatbot/actions/create-chatbot-action'
import { updateChatbotSettingsAction } from '@features/chatbot/actions/update-chatbot-settings-action'
import {
  ChatbotButtonStyle,
  type Chatbot,
  type ChatbotQuestion,
} from '@prisma/client'
import { Button } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { ColorPickerField } from '@shared/components/ui/color-picker-field'
import {
  Field,
  FieldDescription,
  FieldError,
} from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { Switch } from '@shared/components/ui/switch'
import { Textarea } from '@shared/components/ui/textarea'
import { Bot } from 'lucide-react'
import { useActionState, useCallback, useEffect, useState } from 'react'

interface ChatbotSettingsFormProps {
  domainId: string
  chatbot: (Chatbot & { questions: ChatbotQuestion[] }) | null
}

interface CreateState {
  message?: string
  success?: boolean
}

interface UpdateState {
  errors?: {
    welcomeMessage?: string[]
    primaryColor?: string[]
    buttonStyle?: string[]
    borderRadius?: string[]
    theme?: string[]
    chatTitle?: string[]
    chatSubtitle?: string[]
    systemPrompt?: string[]
  }
  message?: string
  success?: boolean
}

function CreateChatbotCard({ domainId }: { domainId: string }): ReactElement {
  const boundAction = useCallback(
    (prevState: CreateState, formData: FormData) =>
      createChatbotAction(domainId, prevState, formData),
    [domainId],
  )

  const [state, action, isPending] = useActionState<CreateState, FormData>(
    boundAction,
    {},
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>AI Chatbot</CardTitle>
            <CardDescription>
              Set up an AI chatbot for this domain
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Enable an AI-powered chatbot that engages visitors, guides them
          through your offerings, and generates leads — all embedded directly on
          your website.
        </p>

        {state.message && (
          <FieldError className="mb-4">{state.message}</FieldError>
        )}

        <form action={action}>
          <Button disabled={isPending} type="submit">
            {isPending ? 'Setting up…' : 'Enable chatbot'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function EditChatbotCard({
  domainId,
  chatbot,
}: {
  domainId: string
  chatbot: Chatbot & { questions: ChatbotQuestion[] }
}): ReactElement {
  const boundAction = useCallback(
    (prevState: UpdateState, formData: FormData) =>
      updateChatbotSettingsAction(chatbot.id, domainId, prevState, formData),
    [chatbot.id, domainId],
  )

  const [state, action, isPending] = useActionState<UpdateState, FormData>(
    boundAction,
    {},
  )
  const [isActive, setIsActive] = useState(chatbot.isActive)
  const [buttonStyle, setButtonStyle] = useState(chatbot.buttonStyle)
  const [theme, setTheme] = useState(chatbot.theme)
  const [borderRadius, setBorderRadius] = useState(chatbot.borderRadius)
  const [successVisible, setSuccessVisible] = useState(false)

  useEffect(() => {
    if (state.success) {
      setSuccessVisible(true)
      const timer = setTimeout(() => setSuccessVisible(false), 3000)

      return () => clearTimeout(timer)
    }
  }, [state.success])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chatbot settings</CardTitle>
        <CardDescription>
          Customize how your AI chatbot looks and behaves.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-6">
          <input
            name="isActive"
            type="hidden"
            value={isActive ? 'true' : 'false'}
          />

          <Field orientation="horizontal">
            <div className="flex flex-1 flex-col gap-0.5">
              <Label htmlFor="isActive">Enable chatbot</Label>
              <p className="text-sm text-muted-foreground">
                Show or hide the chatbot on your website
              </p>
            </div>
            <Switch
              checked={isActive}
              id="isActive"
              onCheckedChange={setIsActive}
            />
          </Field>

          <Field data-invalid={!!state.errors?.welcomeMessage}>
            <Label htmlFor="welcomeMessage">Welcome message</Label>
            <Textarea
              defaultValue={chatbot.welcomeMessage}
              id="welcomeMessage"
              name="welcomeMessage"
              placeholder="Hi! How can I help you today?"
              rows={2}
            />
            {state.errors?.welcomeMessage && (
              <FieldError>{state.errors.welcomeMessage[0]}</FieldError>
            )}
          </Field>

          <ColorPickerField
            defaultValue={chatbot.primaryColor}
            error={state.errors?.primaryColor?.[0]}
          />

          <Field data-invalid={!!state.errors?.buttonStyle}>
            <Label htmlFor="buttonStyle">Button style</Label>
            <input name="buttonStyle" type="hidden" value={buttonStyle} />
            <Select
              value={buttonStyle}
              onValueChange={value => {
                if (value === null || value === undefined) {
                  return
                }

                setButtonStyle(value)
              }}
            >
              <SelectTrigger
                aria-invalid={!!state.errors?.buttonStyle}
                className="w-full"
                id="buttonStyle"
              >
                <SelectValue placeholder="Select button style" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ChatbotButtonStyle.BUBBLE}>
                    Bubble (floating circle)
                  </SelectItem>
                  <SelectItem value={ChatbotButtonStyle.BAR}>
                    Bar (bottom strip)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {state.errors?.buttonStyle && (
              <FieldError>{state.errors.buttonStyle[0]}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!state.errors?.theme}>
            <Label htmlFor="theme">Color theme</Label>
            <input name="theme" type="hidden" value={theme} />
            <Select
              value={theme}
              onValueChange={value => {
                if (value === null || value === undefined) {
                  return
                }

                setTheme(value)
              }}
            >
              <SelectTrigger
                aria-invalid={!!state.errors?.theme}
                className="w-full"
                id="theme"
              >
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="LIGHT">Light</SelectItem>
                  <SelectItem value="DARK">Dark</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {state.errors?.theme && (
              <FieldError>{state.errors.theme[0]}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!state.errors?.borderRadius}>
            <Label htmlFor="borderRadius">Border radius</Label>
            <input name="borderRadius" type="hidden" value={borderRadius} />
            <Select
              value={borderRadius}
              onValueChange={value => {
                if (value === null || value === undefined) {
                  return
                }

                setBorderRadius(value)
              }}
            >
              <SelectTrigger
                aria-invalid={!!state.errors?.borderRadius}
                className="w-full"
                id="borderRadius"
              >
                <SelectValue placeholder="Select border radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="NONE">None (sharp corners)</SelectItem>
                  <SelectItem value="SMALL">Small</SelectItem>
                  <SelectItem value="MEDIUM">Medium (default)</SelectItem>
                  <SelectItem value="LARGE">Large</SelectItem>
                  <SelectItem value="FULL">Full (pill)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {state.errors?.borderRadius && (
              <FieldError>{state.errors.borderRadius[0]}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!state.errors?.chatTitle}>
            <Label htmlFor="chatTitle">Chat window title</Label>
            <Input
              defaultValue={chatbot.chatTitle}
              id="chatTitle"
              name="chatTitle"
              placeholder="Support Chat"
            />
            {state.errors?.chatTitle && (
              <FieldError>{state.errors.chatTitle[0]}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!state.errors?.chatSubtitle}>
            <Label htmlFor="chatSubtitle">
              Chat window subtitle{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              defaultValue={chatbot.chatSubtitle}
              id="chatSubtitle"
              name="chatSubtitle"
              placeholder="AI Assistant • Online"
            />
            {state.errors?.chatSubtitle && (
              <FieldError>{state.errors.chatSubtitle[0]}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!state.errors?.systemPrompt}>
            <Label htmlFor="systemPrompt">
              AI persona{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              defaultValue={chatbot.systemPrompt}
              id="systemPrompt"
              name="systemPrompt"
              placeholder="You are a helpful sales assistant for an online store. Help visitors find the right products..."
              rows={4}
            />
            <FieldDescription>
              Describe how the chatbot should behave and what it should focus
              on.
            </FieldDescription>
            {state.errors?.systemPrompt && (
              <FieldError>{state.errors.systemPrompt[0]}</FieldError>
            )}
          </Field>

          {state.message && <FieldError>{state.message}</FieldError>}

          {successVisible && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Settings saved successfully.
            </p>
          )}

          <Button disabled={isPending} type="submit">
            {isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ChatbotSettingsForm({
  domainId,
  chatbot,
}: ChatbotSettingsFormProps): ReactElement {
  if (!chatbot) {
    return <CreateChatbotCard domainId={domainId} />
  }

  return <EditChatbotCard chatbot={chatbot} domainId={domainId} />
}
