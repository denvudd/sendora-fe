import type { Domain, Workspace } from '@prisma/client'
import type { ReactElement } from 'react'

import { Sidebar, SidebarSeparator } from '@shared/components/ui/sidebar'

import { SidebarDomains } from './sidebar-domains'
import { SidebarLogo } from './sidebar-logo'
import { SidebarNav } from './sidebar-nav'
import { SidebarUser } from './sidebar-user'
import { WorkflowSwitcher } from './workflow-switcher'

interface AppSidebarProps {
  workspace: Workspace
  domains: Domain[]
  canAddDomain: boolean
  domainLimit: number | null
}

export function AppSidebar({
  workspace,
  domains,
  canAddDomain,
  domainLimit,
}: AppSidebarProps): ReactElement {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarLogo />
      <SidebarSeparator />
      <WorkflowSwitcher
        logoUrl={workspace.logoUrl}
        workspaceName={workspace.name}
      />
      <SidebarSeparator />
      <SidebarNav />
      <SidebarSeparator />
      <SidebarDomains
        canAddDomain={canAddDomain}
        domainLimit={domainLimit}
        domains={domains}
      />
      <SidebarUser />
    </Sidebar>
  )
}
