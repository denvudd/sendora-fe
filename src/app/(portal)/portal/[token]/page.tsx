import type { ReactElement } from 'react'

import { findSessionByPortalToken } from '@features/commercial/repositories'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'

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

  const hostname = session.chatbot.domain.hostname

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="size-8 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Our team will be with you shortly
          </h1>
          <p className="text-sm text-muted-foreground">
            Someone from{' '}
            <span className="font-medium text-foreground">{hostname}</span> will
            follow up with you soon. Thank you for your patience.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Session started {format(session.createdAt, 'MMMM d, yyyy hh:mm a')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PortalPage
