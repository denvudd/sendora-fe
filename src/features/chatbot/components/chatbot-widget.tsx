'use client'

import type { ChatbotBorderRadius } from '@prisma/client'
import type { ReactElement } from 'react'

import { ChatbotButtonStyle } from '@prisma/client'
import { ChatbotTheme } from '@prisma/client'
import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { BORDER_RADIUS_CLASS, PORTAL_MARKER } from '@/features/chatbot/utils'
import { cn } from '@/shared/utils/cn'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function getOrCreateSessionUuid(domainId: string): string {
  const key = `sendora-session-${domainId}`
  const existing = localStorage.getItem(key)

  if (existing) {
    return existing
  }

  const uuid = crypto.randomUUID()
  localStorage.setItem(key, uuid)

  return uuid
}

function stripPortalMarker(content: string): string {
  return content.replace(/\n?\{"portal":true\}\s*$/, '').trim()
}

export interface ChatbotWidgetProps {
  domainId: string
  primaryColor: string
  buttonStyle: ChatbotButtonStyle
  borderRadius: ChatbotBorderRadius
  theme: ChatbotTheme
  chatTitle: string
  chatSubtitle: string
  welcomeMessage: string
  showBranding: boolean
}

export function ChatbotWidget({
  domainId,
  primaryColor,
  buttonStyle,
  borderRadius,
  theme,
  chatTitle,
  chatSubtitle,
  welcomeMessage,
  showBranding,
}: ChatbotWidgetProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPortalReady, setIsPortalReady] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const sessionUuidRef = useRef('')
  // Hostname of the page that embedded this iframe (from document.referrer).
  // Sent to the API so it can validate the widget is on the correct domain.
  const embedOriginRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    sessionUuidRef.current = getOrCreateSessionUuid(domainId)

    // document.referrer inside an iframe is the URL of the embedding page.
    // Empty when accessed directly (e.g. for preview/testing).
    if (document.referrer) {
      try {
        embedOriginRef.current = new URL(document.referrer).hostname
      } catch {
        embedOriginRef.current = null
      }
    }
  }, [domainId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchPortalUrl(sessionUuid: string): Promise<void> {
    // Retry a few times since the portal token is written async in onFinish
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      try {
        const res = await fetch(`/api/portal-token/${sessionUuid}`)

        if (res.ok) {
          const data = (await res.json()) as { portalUrl: string }
          setPortalUrl(data.portalUrl)

          return
        }
      } catch {
        // ignore, retry
      }
    }
  }

  async function sendMessage(text: string): Promise<void> {
    if (!text.trim() || isLoading || isPortalReady) {
      return
    }

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    const assistantId = crypto.randomUUID()
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '' },
    ])

    abortRef.current = new AbortController()

    try {
      const response = await fetch(`/api/chat/${domainId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionUuid: sessionUuidRef.current,
          embedOrigin: embedOriginRef.current,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: accumulated } : m,
          ),
        )
      }

      if (accumulated.includes(PORTAL_MARKER)) {
        setIsPortalReady(true)
        void fetchPortalUrl(sessionUuidRef.current)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  content: 'Sorry, something went wrong. Please try again.',
                }
              : m,
          ),
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    void sendMessage(input)
  }

  const panelBorderRadius = BORDER_RADIUS_CLASS[borderRadius]
  const isDark = theme === ChatbotTheme.DARK

  const chatProps = {
    isPortalReady,
    portalUrl,
    isLoading,
    messages,
    input,
    messagesEndRef,
    primaryColor,
    chatTitle,
    chatSubtitle,
    panelBorderRadius,
    showBranding,
    onClose: () => setIsOpen(false),
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setInput(e.target.value),
    onSubmit: handleSubmit,
  }

  return (
    <div className={cn('w-full', isDark ? 'dark' : undefined)}>
      {buttonStyle === ChatbotButtonStyle.BAR ? (
        <div className="fixed inset-x-0 bottom-0 w-full">
          {isOpen && <ChatPanel {...chatProps} />}
          <button
            className="flex w-full items-center justify-between px-5 py-3 text-white shadow-lg"
            style={{ backgroundColor: primaryColor }}
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              <span className="text-sm font-medium">
                {welcomeMessage.length > 60
                  ? `${welcomeMessage.slice(0, 60)}…`
                  : welcomeMessage}
              </span>
            </div>
            {isOpen ? (
              <X className="size-4" />
            ) : (
              <MessageCircle className="size-4" />
            )}
          </button>
        </div>
      ) : (
        <div className="fixed bottom-5 right-5 flex flex-col items-end gap-3">
          {isOpen && <ChatPanel {...chatProps} />}
          <button
            aria-label={isOpen ? 'Close chat' : 'Open chat'}
            className="flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: primaryColor }}
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
          >
            {isOpen ? (
              <X className="size-6 text-white" />
            ) : (
              <MessageCircle className="size-6 text-white" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}

interface ChatPanelProps {
  isPortalReady: boolean
  portalUrl: string | null
  isLoading: boolean
  messages: ChatMsg[]
  input: string
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  primaryColor: string
  chatTitle: string
  chatSubtitle: string
  panelBorderRadius: string
  showBranding: boolean
  onClose: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function ChatPanel({
  isPortalReady,
  portalUrl,
  isLoading,
  messages,
  input,
  messagesEndRef,
  primaryColor,
  chatTitle,
  chatSubtitle,
  panelBorderRadius,
  showBranding,
  onClose,
  onInputChange,
  onSubmit,
}: ChatPanelProps): ReactElement {
  return (
    <div
      className={`flex h-[480px] w-[360px] flex-col overflow-hidden bg-gray-50 shadow-2xl dark:bg-gray-900 ${panelBorderRadius}`}
    >
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{chatTitle}</p>
            <p className="text-xs text-white/75">
              {isPortalReady ? 'Ready to book!' : chatSubtitle}
            </p>
          </div>
        </div>
        <button
          aria-label="Close chat"
          className="rounded-full p-1 transition-colors hover:bg-white/20"
          type="button"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">
            Start a conversation…
          </p>
        )}
        {messages.map(message => {
          const isUser = message.role === 'user'
          const content =
            message.role === 'assistant'
              ? stripPortalMarker(message.content)
              : message.content

          return (
            <div
              key={message.id}
              className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  isUser
                    ? 'rounded-br-sm text-white'
                    : 'rounded-bl-sm bg-white/90 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}
                style={isUser ? { backgroundColor: primaryColor } : undefined}
              >
                {content || (isLoading && !isUser ? '…' : '')}
              </div>
            </div>
          )
        })}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-white/90 px-4 py-3 dark:bg-gray-800">
              <div className="flex gap-1">
                <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        {isPortalReady && (
          <div className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-center text-sm dark:border-border dark:bg-card">
            <p className="mb-2 font-medium text-foreground">
              You&apos;re ready to book!
            </p>
            {portalUrl ? (
              <a
                className="inline-block rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                href={portalUrl}
                rel="noopener noreferrer"
                style={{ backgroundColor: primaryColor }}
                target="_blank"
              >
                Book your appointment
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                Preparing your booking link…
              </p>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isPortalReady && (
        <form
          className={cn(
            'flex items-center gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800',
            showBranding ? 'pb-1' : '',
          )}
          onSubmit={onSubmit}
        >
          <input
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-gray-400"
            disabled={isLoading}
            placeholder="Type a message…"
            value={input}
            onChange={onInputChange}
          />
          <button
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
            disabled={isLoading || !input.trim()}
            style={{ backgroundColor: primaryColor }}
            type="submit"
          >
            <Send className="size-4" />
            <span className="sr-only">Send</span>
          </button>
        </form>
      )}

      {showBranding && (
        <div className="flex justify-center pb-1 text-[10px] text-gray-400 dark:text-gray-600 bg-white dark:border-gray-700 dark:bg-gray-800">
          Powered by{' '}
          <a
            className="ml-1 font-medium text-gray-500 hover:text-gray-700 dark:text-gray-500"
            href="https://sendora.io"
            rel="noopener noreferrer"
            target="_blank"
          >
            Sendora
          </a>
        </div>
      )}
    </div>
  )
}
