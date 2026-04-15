'use client'

import type { ChatSessionStatus } from '@prisma/client'
import type { ReactElement, ReactNode } from 'react'

import {
  CalendarCheck,
  Link2,
  Loader2,
  PhoneOff,
  Send,
  UserCheck,
} from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'

import { closeSessionAction } from '@/features/chatbot/actions/close-session-action'
import { getSessionMessagesAction } from '@/features/chatbot/actions/get-session-messages-action'
import { sendOperatorMessageAction } from '@/features/chatbot/actions/send-operator-message-action'
import { sendPortalLinkMessageAction } from '@/features/chatbot/actions/send-portal-link-message-action'
import { setSessionHumanAction } from '@/features/chatbot/actions/set-session-human-action'
import { containsRealtimeMarker, stripMarkers } from '@/features/chatbot/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  getPusherClient,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
} from '@/shared/lib/pusher'
import { cn } from '@/shared/utils/cn'

interface Message {
  id: string
  role: string
  content: string
  createdAt: Date
}

interface ConversationDetailProps {
  sessionId: string
}

const STATUS_BADGE: Record<
  ChatSessionStatus,
  {
    label: string
    variant: 'default' | 'destructive' | 'secondary' | 'outline'
  }
> = {
  AI: { label: 'AI Mode', variant: 'secondary' },
  HUMAN: { label: 'Live Agent', variant: 'destructive' },
  CLOSED: { label: 'Closed', variant: 'outline' },
}

// Renders text with embedded URLs as clickable links
function MessageWithLinks({ content }: { content: string }): ReactElement {
  const parts: ReactNode[] = []
  const regex = /https?:\/\/[^\s<>"']+/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    const url = match[0]
    parts.push(
      <a
        key={match.index}
        className="break-all underline underline-offset-2 hover:opacity-80"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {url}
      </a>,
    )
    lastIndex = match.index + url.length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return <span>{parts}</span>
}

// Visual separator shown after the message that triggered the REALTIME handoff
function HandoffIndicator(): ReactElement {
  return (
    <div className="my-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-border" />
      <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
        <UserCheck className="size-3" />
        Session transferred to live agent
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

// Visual separator shown at the bottom when session is CLOSED
function ClosedIndicator(): ReactElement {
  return (
    <div className="my-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-border" />
      <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        <PhoneOff className="size-3" />
        Session closed
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

export function ConversationDetail({
  sessionId,
}: ConversationDetailProps): ReactElement {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<ChatSessionStatus>('AI')
  const [domainHostname, setDomainHostname] = useState('')
  const [operatorInput, setOperatorInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, startSending] = useTransition()
  const [isEscalating, startEscalating] = useTransition()
  const [isClosing, startClosing] = useTransition()
  const [isSendingPortal, startSendingPortal] = useTransition()
  const [portalSent, setPortalSent] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    setMessages([])
    setPortalSent(false)

    getSessionMessagesAction(sessionId).then(session => {
      if (session) {
        setMessages(session.messages as Message[])
        setStatus(session.status)
        setDomainHostname(session.chatbot.domain.hostname)
      }

      setIsLoading(false)
    })
  }, [sessionId])

  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(PUSHER_CHANNELS.session(sessionId))

    channel.bind(
      PUSHER_EVENTS.NEW_CUSTOMER_MESSAGE,
      (data: {
        id: string
        role: string
        content: string
        createdAt: string
      }) => {
        setMessages(prev => [
          ...prev,
          { ...data, createdAt: new Date(data.createdAt) },
        ])
      },
    )

    return () => {
      pusher.unsubscribe(PUSHER_CHANNELS.session(sessionId))
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleTransferToHuman() {
    startEscalating(async () => {
      const result = await setSessionHumanAction(sessionId)

      if (result.success) {
        setStatus('HUMAN')
      }
    })
  }

  function handleCloseSession() {
    startClosing(async () => {
      const result = await closeSessionAction(sessionId)

      if (result.success) {
        setStatus('CLOSED')
      }
    })
  }

  function handleSendMessage() {
    if (!operatorInput.trim() || isSending) {
      return
    }

    const content = operatorInput.trim()
    setOperatorInput('')

    startSending(async () => {
      const result = await sendOperatorMessageAction(sessionId, content)

      if (result.success) {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content,
            createdAt: new Date(),
          },
        ])
      }
    })
  }

  function handleSendPortalLink() {
    startSendingPortal(async () => {
      const result = await sendPortalLinkMessageAction(sessionId)

      if (result.success) {
        setPortalSent(true)
        const content = `I've prepared a booking link for you. Click here to schedule your appointment: ${process.env.NEXT_PUBLIC_APP_URL}${result.portalUrl}`
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content,
            createdAt: new Date(),
          },
        ])
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const badge = STATUS_BADGE[status]
  const isHuman = status === 'HUMAN'
  const isClosed = status === 'CLOSED'

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{domainHostname}</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        {!isClosed && (
          <div className="flex items-center gap-2">
            {!isHuman && (
              <Button
                disabled={isEscalating}
                size="sm"
                variant="outline"
                onClick={handleTransferToHuman}
              >
                {isEscalating ? (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 size-3.5" />
                )}
                Transfer to Human
              </Button>
            )}
            <Button
              className="text-muted-foreground hover:text-destructive"
              disabled={isClosing}
              size="sm"
              variant="ghost"
              onClick={handleCloseSession}
            >
              {isClosing ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <PhoneOff className="mr-2 size-3.5" />
              )}
              Close Session
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet.
          </p>
        )}

        {messages.map(msg => {
          const isUser = msg.role === 'user'
          const hasRealtimeMarker = containsRealtimeMarker(msg.content)
          const cleanContent = stripMarkers(msg.content)

          // Don't render empty stripped messages (pure-marker messages shouldn't exist,
          // but guard just in case)
          if (!cleanContent && hasRealtimeMarker) {
            return <HandoffIndicator key={msg.id} />
          }

          return (
            <div key={msg.id}>
              <div
                className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    isUser
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground',
                  )}
                >
                  <MessageWithLinks content={cleanContent} />
                </div>
              </div>

              {/* Show handoff indicator directly after the message that triggered it */}
              {hasRealtimeMarker && <HandoffIndicator />}
            </div>
          )
        })}

        {isClosed && <ClosedIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Operator controls — HUMAN only */}
      {isHuman && (
        <>
          <Separator />
          <div className="p-3">
            <div className="flex items-end gap-2">
              <Textarea
                className="min-h-[60px] flex-1 resize-none text-sm"
                disabled={isSending}
                placeholder="Type a message to the customer… (Enter to send, Shift+Enter for newline)"
                value={operatorInput}
                onChange={e => setOperatorInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex flex-col gap-2">
                <Button
                  disabled={isSending || !operatorInput.trim()}
                  size="icon"
                  onClick={handleSendMessage}
                >
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
                <Button
                  className="shrink-0"
                  disabled={isSendingPortal || portalSent}
                  size="icon"
                  title="Send portal booking link"
                  variant="outline"
                  onClick={handleSendPortalLink}
                >
                  {isSendingPortal ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : portalSent ? (
                    <CalendarCheck className="size-4 text-green-600" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            {portalSent && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Booking link sent to customer.
              </p>
            )}
          </div>
        </>
      )}

      {/* Closed state footer */}
      {isClosed && (
        <div className="border-t bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
          This session is closed and read-only.
        </div>
      )}
    </div>
  )
}
