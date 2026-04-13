import type {
  Chatbot,
  ChatbotQuestion,
  Domain,
  WorkspaceSubscription,
} from '@prisma/client'
import type { ReactElement } from 'react'

import { ChatbotPreview } from '@features/chatbot/components/chatbot-preview'
import { ChatbotQuestionsEditor } from '@features/chatbot/components/chatbot-questions-editor'
import { ChatbotSettingsForm } from '@features/chatbot/components/chatbot-settings-form'
import { ChatbotSnippet } from '@features/chatbot/components/chatbot-snippet'
import { DomainSettingsForm } from '@features/domains/components/domain-settings-form'
import { DomainVerificationCard } from '@features/domains/components/domain-verification-card'
import { Globe } from 'lucide-react'

import { PLAN_CODE } from '@/shared/constants/plan-code'

interface DomainPageProps {
  domain: Domain
  chatbot:
    | (Chatbot & {
        questions: ChatbotQuestion[]
        domain: {
          id: string
          hostname: string
          isVerified: boolean
          verificationToken: string | null
          lastVerifiedCheckAt: Date | null
          workspace: {
            subscriptions: (WorkspaceSubscription & {
              plan: { code: string }
            })[]
          }
        }
      })
    | null
}

export function DomainPage({ domain, chatbot }: DomainPageProps): ReactElement {
  const activeSubscription = chatbot?.domain.workspace.subscriptions[0]
  const planCode = activeSubscription?.plan.code ?? PLAN_CODE.STANDARD
  const showBranding = planCode === PLAN_CODE.STANDARD

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

      <DomainVerificationCard domain={domain} />

      <ChatbotSettingsForm chatbot={chatbot} domainId={domain.id} />

      {chatbot && (
        <ChatbotQuestionsEditor
          chatbotId={chatbot.id}
          domainId={domain.id}
          questions={chatbot.questions}
        />
      )}

      {chatbot && (
        <ChatbotPreview
          borderRadius={chatbot.borderRadius}
          buttonStyle={chatbot.buttonStyle}
          chatSubtitle={chatbot.chatSubtitle}
          chatTitle={chatbot.chatTitle}
          primaryColor={chatbot.primaryColor}
          showBranding={showBranding}
          theme={chatbot.theme}
          welcomeMessage={chatbot.welcomeMessage}
        />
      )}

      {chatbot && <ChatbotSnippet chatbot={chatbot} domain={domain} />}
    </div>
  )
}
