import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findChatbotWithPlanByDomainId,
  findDomainById,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { DomainPage } from '@features/domains/components/domain-page'
import { notFound, redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface DomainDetailPageProps {
  params: Promise<{ domainId: string }>
}

const DomainDetailPage = async ({
  params,
}: DomainDetailPageProps): Promise<ReactElement> => {
  const { domainId } = await params
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/sign-in')
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  const [domain, chatbot] = await Promise.all([
    findDomainById({ domainId, workspaceId: workspace.id }),
    findChatbotWithPlanByDomainId({ domainId }),
  ])

  if (!domain) {
    notFound()
  }

  return <DomainPage chatbot={chatbot} domain={domain} />
}

export default DomainDetailPage
