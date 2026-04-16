import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  listDomainsByWorkspace,
  listLeadsWithFilters,
} from '@features/commercial/repositories'
import { LeadsFilters } from '@features/leads/components/leads-filters'
import { LeadsTable } from '@features/leads/components/leads-table'
import { LeadStatus } from '@prisma/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { ROUTES } from '@/shared/constants/routes'

interface LeadsPageProps {
  searchParams: Promise<{
    domainId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }>
}

const LeadsPage = async ({
  searchParams,
}: LeadsPageProps): Promise<ReactElement> => {
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

  const params = await searchParams

  const validStatuses: LeadStatus[] = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.QUALIFIED,
    LeadStatus.WON,
    LeadStatus.LOST,
  ]
  const status = validStatuses.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : undefined

  const [leads, domains] = await Promise.all([
    listLeadsWithFilters({
      workspaceId: workspace.id,
      domainId: params.domainId,
      status,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    }),
    listDomainsByWorkspace({ workspaceId: workspace.id }),
  ])

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contacts captured automatically when visitors complete the appointment
          booking flow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
          <CardDescription>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense>
            <LeadsFilters domains={domains} />
          </Suspense>
          <LeadsTable leads={leads} />
        </CardContent>
      </Card>
    </div>
  )
}

export default LeadsPage
