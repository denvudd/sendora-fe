import type { Domain } from '@prisma/client'
import type { ReactElement } from 'react'

import { Badge } from '@shared/components/ui/badge'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar'
import { Globe } from 'lucide-react'

interface SidebarDomainsProps {
  domains: Domain[]
}

export function SidebarDomains({ domains }: SidebarDomainsProps): ReactElement {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Domains</SidebarGroupLabel>
      <SidebarMenu>
        {domains.length === 0 ? (
          <p className="px-2 text-xs text-sidebar-foreground/50">
            No domains yet.
          </p>
        ) : (
          domains.map(domain => (
            <SidebarMenuItem key={domain.id}>
              <SidebarMenuButton size="sm" tooltip={domain.hostname}>
                <Globe />
                <span className="truncate">{domain.hostname}</span>
                {domain.isVerified && (
                  <Badge className="ml-auto text-xs" variant="outline">
                    Verified
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
