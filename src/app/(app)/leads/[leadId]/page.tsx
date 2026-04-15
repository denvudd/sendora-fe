import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findLeadById,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { LeadDetailView } from '@features/leads/components/lead-detail-view'
import { notFound, redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface LeadDetailPageProps {
  params: Promise<{ leadId: string }>
}

const LeadDetailPage = async ({
  params,
}: LeadDetailPageProps): Promise<ReactElement> => {
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
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  const { leadId } = await params

  const lead = await findLeadById({ workspaceId: workspace.id, leadId })

  if (!lead) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8">
      <LeadDetailView lead={lead} />
    </div>
  )
}

export default LeadDetailPage
