import type { ReactElement } from 'react'

import { findSessionByPortalToken } from '@features/commercial/repositories'
import { PortalBookingFlow } from '@features/portal/components/portal-booking-flow'
import { notFound } from 'next/navigation'

import { PLAN_CODE } from '@/shared/constants/plan-code'

interface PortalPageProps {
  params: Promise<{ token: string }>
}

const PortalPage = async ({
  params,
}: PortalPageProps): Promise<ReactElement> => {
  const { token } = await params

  const session = await findSessionByPortalToken({ portalToken: token })

  if (!session) {
    notFound()
  }

  const existingAnswers =
    session.metadata &&
    typeof session.metadata === 'object' &&
    !Array.isArray(session.metadata) &&
    'answers' in (session.metadata as object)
      ? ((session.metadata as Record<string, unknown>).answers as Record<
          string,
          string
        >)
      : {}

  const activeSubscription = session?.chatbot?.domain.workspace.subscriptions[0]
  const planCode = activeSubscription?.plan.code ?? PLAN_CODE.STANDARD
  const showBranding = planCode === PLAN_CODE.STANDARD

  return (
    <div className="flex min-h-screen items-center flex-col gap-4 justify-center bg-background p-4">
      <PortalBookingFlow
        defaultAnswers={existingAnswers}
        hostname={session.chatbot.domain.hostname}
        portalToken={token}
        questions={session.chatbot.questions}
        schedule={session.chatbot.domain.workspace.appointmentSchedule ?? null}
      />
      {showBranding && (
        <div className="flex justify-center pb-1 text-[10px] text-gray-400 dark:text-gray-600 dark:border-gray-700">
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

export default PortalPage
