import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import { ConversationsView } from '@features/chatbot/components/conversations-view'
import {
  findOrCreateUser,
  findSessionsByWorkspaceId,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { ROUTES } from '@/shared/constants/routes'

const ConversationsPage = async (): Promise<ReactElement> => {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect(ROUTES.SignIn)
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect(ROUTES.SignIn)
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  const sessions = await findSessionsByWorkspaceId({
    workspaceId: workspace.id,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Conversations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All chatbot sessions across your domains. Live sessions require your
          attention.
        </p>
      </div>

      <Suspense>
        <ConversationsView
          initialSessions={sessions}
          workspaceId={workspace.id}
        />
      </Suspense>
    </div>
  )
}

export default ConversationsPage
