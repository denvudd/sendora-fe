'use client'

import type { ChatbotBorderRadius } from '@prisma/client'
import type { ReactElement } from 'react'

import { ChatbotButtonStyle } from '@prisma/client'
import { ChatbotTheme } from '@prisma/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { MessageCircle, Send, X } from 'lucide-react'
import Link from 'next/link'

import { BORDER_RADIUS_CLASS } from '@/features/chatbot/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

interface ChatbotPreviewProps {
  primaryColor: string
  buttonStyle: ChatbotButtonStyle
  borderRadius: ChatbotBorderRadius
  theme: ChatbotTheme
  chatTitle: string
  chatSubtitle: string
  welcomeMessage: string
  showBranding: boolean
}

export function ChatbotPreview({
  primaryColor,
  buttonStyle,
  borderRadius,
  theme,
  chatTitle,
  chatSubtitle,
  welcomeMessage,
  showBranding,
}: ChatbotPreviewProps): ReactElement {
  const panelRadius = BORDER_RADIUS_CLASS[borderRadius]
  const isDark = theme === ChatbotTheme.DARK

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
          className={cn(
            'relative h-[580px] overflow-hidden rounded-lg border border-border',
            isDark ? 'bg-gray-600' : 'bg-muted/30',
            isDark ? 'dark' : '',
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2 text-center opacity-30 w-full">
              <div className="mx-auto h-3 w-1/2 rounded bg-border" />
              <div className="mx-auto h-3 w-1/2 rounded bg-border" />
              <div className="mx-auto h-3 w-1/2 rounded bg-border" />
              <div className="mx-auto h-3 w-1/2 rounded bg-border" />
              <div className="mx-auto h-3 w-1/2 rounded bg-border" />
            </div>
          </div>

          {buttonStyle === ChatbotButtonStyle.BAR ? (
            <div
              className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-2.5"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-white" />
                <span className="text-sm font-medium text-white">
                  {welcomeMessage}
                </span>
              </div>
              <span className="text-xs text-white/80">Chat with us</span>
            </div>
          ) : (
            <div className="absolute bottom-5 right-5 flex flex-col items-end gap-2">
              <div
                className={`flex h-[480px] w-[360px] flex-col overflow-hidden bg-gray-50 shadow-2xl dark:bg-gray-900 ${panelRadius}`}
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
                      <p className="text-xs text-white/75">{chatSubtitle}</p>
                    </div>
                  </div>
                  <button
                    aria-label="Close chat"
                    className="rounded-full p-1 transition-colors hover:bg-white/20"
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                {/* Message bubble */}
                <div className="px-2 py-1.5 w-full flex flex-col">
                  <div
                    className={`max-w-[80%] rounded-2xl inline-block text-white self-end rounded-bl-sm px-3 py-2 text-sm ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'}`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Hi!
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <div
                    className={`max-w-[80%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm inline-block ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {welcomeMessage}
                  </div>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 border-t mt-auto border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800',
                    showBranding ? 'pb-1' : '',
                  )}
                >
                  <div className="flex-1 rounded-full text-muted-foreground border border-gray-200 bg-gray-50 px-4 py-2 h-[38px] text-sm outline-none focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-gray-400">
                    Type a message…
                  </div>
                  <button
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                    type="button"
                  >
                    <Send className="size-4" />
                    <span className="sr-only">Send</span>
                  </button>
                </div>
                {showBranding && (
                  <TooltipProvider delay={400}>
                    <Tooltip>
                      <TooltipTrigger>
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
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>
                          Branding is visible only on free plans. You can{' '}
                          <Link
                            className="text-primary hover:underline"
                            href={ROUTES.Billing}
                          >
                            upgrade your plan
                          </Link>{' '}
                          to remove it.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <button
                aria-label="Open chat"
                className="flex size-14 items-center justify-center rounded-full shadow-lg transition-transform"
                style={{ backgroundColor: primaryColor }}
                type="button"
              >
                <MessageCircle className="size-6 text-white" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
