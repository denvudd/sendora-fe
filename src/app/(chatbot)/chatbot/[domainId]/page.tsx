import type { ReactElement } from 'react'

import { ChatbotWidget } from '@features/chatbot/components/chatbot-widget'
import {
  findChatbotWithPlanByDomainId,
  updateDomainVerificationCheck,
} from '@features/commercial/repositories'
import {
  checkMetaTag,
  fetchDomainHtml,
} from '@features/domains/lib/check-domain-meta-tag'

export const dynamic = 'force-dynamic'

const DOMAIN_RECHECK_INTERVAL = 60 * 60 * 1000

interface PageProps {
  params: Promise<{ domainId: string }>
}

async function ChatbotWidgetPage({ params }: PageProps): Promise<ReactElement> {
  const { domainId } = await params

  const chatbot = await findChatbotWithPlanByDomainId({ domainId })

  if (!chatbot || !chatbot.isActive) {
    return <BlockedState />
  }

  const { domain } = chatbot
  const now = new Date()
  const lastCheck = domain.lastVerifiedCheckAt
  const shouldRecheck =
    !lastCheck || now.getTime() - lastCheck.getTime() > DOMAIN_RECHECK_INTERVAL

  let isVerified = domain.isVerified

  if (shouldRecheck && domain.verificationToken) {
    const html = await fetchDomainHtml(domain.hostname)
    const tagFound = html ? checkMetaTag(html, domain.verificationToken) : false

    await updateDomainVerificationCheck({
      domainId: domain.id,
      isVerified: tagFound,
      lastVerifiedCheckAt: now,
    })

    isVerified = tagFound
  }

  if (!isVerified) {
    return <BlockedState />
  }

  const activeSubscription = domain.workspace.subscriptions[0]
  const planCode = activeSubscription?.plan.code ?? 'STANDARD'
  const showBranding = planCode === 'STANDARD'

  return (
    <>
      <style>{`
        :root { --chat-color: ${chatbot.primaryColor}; }
        html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }
      `}</style>
      <ChatbotWidget
        borderRadius={chatbot.borderRadius}
        buttonStyle={chatbot.buttonStyle}
        chatSubtitle={chatbot.chatSubtitle}
        chatTitle={chatbot.chatTitle}
        domainId={domainId}
        primaryColor={chatbot.primaryColor}
        showBranding={showBranding}
        theme={chatbot.theme}
        welcomeMessage={chatbot.welcomeMessage}
      />
    </>
  )
}

export default ChatbotWidgetPage

function BlockedState(): ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'transparent',
      }}
    />
  )
}
