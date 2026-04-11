import type { ReactElement, ReactNode } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import { AppSidebar } from '@features/app-layout/components/app-sidebar'
import { getEffectiveLimits } from '@features/commercial/lib/feature-limits'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  listDomainsByWorkspace,
} from '@features/commercial/repositories'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@shared/components/ui/sidebar'
import { redirect } from 'next/navigation'

const AppLayout = async ({
  children,
}: {
  children: ReactNode
}): Promise<ReactElement> => {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const clerkUser = await currentUser({
    treatPendingAsSignedOut: true,
  })

  if (!clerkUser) {
    redirect('/sign-in')
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect('/onboarding')
  }

  const [domains, limits] = await Promise.all([
    listDomainsByWorkspace({ workspaceId: workspace.id }),
    getEffectiveLimits(workspace.id),
  ])

  const domainLimit = limits.MAX_DOMAINS
  const canAddDomain = domainLimit === null || domains.length < domainLimit

  return (
    <SidebarProvider>
      <AppSidebar
        canAddDomain={canAddDomain}
        domainLimit={domainLimit}
        domains={domains}
        workspace={workspace}
      />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <div className="flex flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppLayout
