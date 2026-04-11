import type { Domain } from '@prisma/client'
import type { ReactElement } from 'react'

import { DomainChatbotIntegration } from '@features/domains/components/domain-chatbot-integration'
import { DomainSettingsForm } from '@features/domains/components/domain-settings-form'
import { Globe } from 'lucide-react'

interface DomainPageProps {
  domain: Domain
}

export function DomainPage({ domain }: DomainPageProps): ReactElement {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        {domain.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${domain.hostname} icon`}
            className="size-10 rounded-lg border border-border object-cover"
            height={40}
            src={domain.iconUrl}
            width={40}
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
            <Globe className="size-5 text-muted-foreground" />
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">{domain.hostname}</h1>
          <p className="text-sm text-muted-foreground">
            {domain.isPrimary ? 'Primary domain' : 'Domain settings'}
          </p>
        </div>
      </div>

      <DomainSettingsForm domain={domain} />
      <DomainChatbotIntegration domain={domain} />
    </div>
  )
}
