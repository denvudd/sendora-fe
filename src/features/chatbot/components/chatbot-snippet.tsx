'use client'

import type { Chatbot, Domain } from '@prisma/client'
import type { ReactElement } from 'react'

import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface ChatbotSnippetProps {
  domain: Domain
  chatbot: Chatbot
}

export function ChatbotSnippet({
  domain,
  chatbot,
}: ChatbotSnippetProps): ReactElement {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.sendora.io'

  const snippet = `<!-- Sendora Chatbot — paste before </body> -->
<script src="${appUrl}/chatbot/embed" data-domain-id="${domain.id}" async></script>`

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Embed snippet</CardTitle>
          {chatbot.isActive ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <CardDescription>
          Add this snippet to{' '}
          <span className="font-medium text-foreground">{domain.hostname}</span>{' '}
          just before the closing{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {'</body>'}
          </code>{' '}
          tag. Style changes apply automatically — no need to update the
          snippet.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 pr-12 text-sm text-muted-foreground select-all">
            <code>{snippet}</code>
          </pre>

          <Button
            className="absolute right-2 top-2"
            size="icon"
            variant="ghost"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="size-4" />
            )}
            <span className="sr-only">
              {copied ? 'Copied' : 'Copy snippet'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
