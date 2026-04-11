import type { Domain } from '@prisma/client'
import type { ReactElement } from 'react'

import { Badge } from '@shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'

interface DomainChatbotIntegrationProps {
  domain: Domain
}

export function DomainChatbotIntegration({
  domain,
}: DomainChatbotIntegrationProps): ReactElement {
  const snippet = `<!-- Sendora Chatbot — paste before </body> -->
<iframe
  src="https://app.sendora.io/chatbot/${domain.id}"
  style="position:fixed;bottom:24px;right:24px;width:400px;height:600px;border:none;z-index:9999;"
  allow="microphone"
  title="Sendora Chatbot"
></iframe>`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Chatbot integration</CardTitle>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
        <CardDescription>
          Embed your AI chatbot on{' '}
          <span className="font-medium text-foreground">{domain.hostname}</span>{' '}
          by adding the following snippet to your website&apos;s HTML, just
          before the closing{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {'</body>'}
          </code>{' '}
          tag.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground select-all">
            <code>{snippet}</code>
          </pre>

          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 text-center">
              <Badge className="px-3 py-1 text-sm" variant="outline">
                Coming soon
              </Badge>
              <p className="text-sm text-muted-foreground max-w-xs">
                Chatbot configuration will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
