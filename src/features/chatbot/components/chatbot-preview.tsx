'use client'

import type {
  ChatbotBorderRadius,
  ChatbotButtonStyle,
  ChatbotTheme,
} from '@prisma/client'
import type { ReactElement } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { MessageCircle } from 'lucide-react'

const BORDER_RADIUS_CLASS: Record<ChatbotBorderRadius, string> = {
  NONE: 'rounded-none',
  SMALL: 'rounded-lg',
  MEDIUM: 'rounded-2xl',
  LARGE: 'rounded-3xl',
  FULL: 'rounded-[2rem]',
}

interface ChatbotPreviewProps {
  primaryColor: string
  buttonStyle: ChatbotButtonStyle
  borderRadius: ChatbotBorderRadius
  theme: ChatbotTheme
  chatTitle: string
  chatSubtitle: string
  welcomeMessage: string
}

export function ChatbotPreview({
  primaryColor,
  buttonStyle,
  borderRadius,
  theme,
  chatTitle,
  chatSubtitle,
  welcomeMessage,
}: ChatbotPreviewProps): ReactElement {
  const panelRadius = BORDER_RADIUS_CLASS[borderRadius]
  const isDark = theme === 'DARK'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget preview</CardTitle>
        <CardDescription>
          A visual preview of how your chatbot will appear on your website.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div
          className={`relative h-52 overflow-hidden rounded-lg border border-border ${isDark ? 'bg-gray-900' : 'bg-muted/30'}`}
        >
          {/* Mock website background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2 text-center opacity-30">
              <div className="mx-auto h-2 w-24 rounded bg-border" />
              <div className="mx-auto h-2 w-32 rounded bg-border" />
              <div className="mx-auto h-2 w-20 rounded bg-border" />
            </div>
          </div>

          {buttonStyle === 'BAR' ? (
            /* BAR style */
            <div
              className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-2.5"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-white" />
                <span className="text-sm font-medium text-white">
                  {welcomeMessage.length > 30
                    ? `${welcomeMessage.slice(0, 30)}…`
                    : welcomeMessage}
                </span>
              </div>
              <span className="text-xs text-white/80">Chat with us</span>
            </div>
          ) : (
            /* BUBBLE style — shows open panel preview */
            <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
              {/* Mini chat panel */}
              <div
                className={`w-44 overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} ${panelRadius}`}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="size-3 text-white" />
                  <div>
                    <p className="text-[10px] font-semibold text-white leading-none">
                      {chatTitle.length > 18
                        ? `${chatTitle.slice(0, 18)}…`
                        : chatTitle}
                    </p>
                    <p className="text-[9px] text-white/75 leading-none mt-0.5">
                      {chatSubtitle.length > 22
                        ? `${chatSubtitle.slice(0, 22)}…`
                        : chatSubtitle}
                    </p>
                  </div>
                </div>
                {/* Message bubble */}
                <div className="px-2 py-1.5">
                  <div
                    className={`rounded-xl rounded-bl-sm px-2 py-1 text-[9px] inline-block ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {welcomeMessage.length > 35
                      ? `${welcomeMessage.slice(0, 35)}…`
                      : welcomeMessage}
                  </div>
                </div>
              </div>
              {/* Button */}
              <button
                aria-label="Open chat"
                className="flex size-9 items-center justify-center rounded-full shadow-lg"
                style={{ backgroundColor: primaryColor }}
                type="button"
              >
                <MessageCircle className="size-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
