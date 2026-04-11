import type { Domain } from '@prisma/client'
import type { ReactElement } from 'react'

import { AddDomainDialog } from '@features/domains/components/add-domain-dialog'
import { Badge } from '@shared/components/ui/badge'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar'
import { Globe } from 'lucide-react'
import Link from 'next/link'

import { Image } from '@/shared/components/ui/image'

interface SidebarDomainsProps {
  domains: Domain[]
  canAddDomain: boolean
  domainLimit: number | null
}

export function SidebarDomains({
  domains,
  canAddDomain,
  domainLimit,
}: SidebarDomainsProps): ReactElement {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center">
        Domains
        <AddDomainDialog
          canAddDomain={canAddDomain}
          domainCount={domains.length}
          domainLimit={domainLimit}
        />
      </SidebarGroupLabel>
      <SidebarMenu>
        {domains.length === 0 ? (
          <p className="px-2 text-xs text-sidebar-foreground/50">
            No domains yet.
          </p>
        ) : (
          domains.map(domain => (
            <SidebarMenuItem key={domain.id}>
              <SidebarMenuButton
                render={<Link href={`/domains/${domain.id}`} />}
                size="sm"
                tooltip={domain.hostname}
              >
                {domain.iconUrl ? (
                  <Image
                    alt={domain.hostname}
                    className="size-4 rounded object-cover"
                    height={16}
                    src={domain.iconUrl}
                    width={16}
                  />
                ) : (
                  <Globe />
                )}
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
