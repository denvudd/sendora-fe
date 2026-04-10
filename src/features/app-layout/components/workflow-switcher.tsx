'use client'

import type { ReactElement } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import { Image } from '@shared/components/ui/image'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar'
import { ChevronsUpDown } from 'lucide-react'

const DEFAULT_WORKSPACE_LOGO = '/images/logo.png'

interface WorkflowSwitcherProps {
  workspaceName: string
  logoUrl?: string | null
}

function WorkspaceLogo({
  alt,
  src,
}: {
  alt: string
  src: string
}): ReactElement {
  return (
    <Image
      alt={alt}
      className="size-8 shrink-0 rounded-md border border-sidebar-border bg-sidebar-accent object-cover"
      height={32}
      src={src}
      width={32}
    />
  )
}

export function WorkflowSwitcher({
  workspaceName,
  logoUrl,
}: WorkflowSwitcherProps): ReactElement {
  const resolvedLogoSrc = logoUrl?.trim() || DEFAULT_WORKSPACE_LOGO
  console.log('🚀 ~ WorkflowSwitcher ~ resolvedLogoSrc:', resolvedLogoSrc)

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<SidebarMenuButton className="w-full" size="lg" />}
            >
              <WorkspaceLogo
                alt={`${workspaceName} logo`}
                src={resolvedLogoSrc}
              />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 leading-none">
                <span className="text-xs text-sidebar-foreground/60">
                  Workspace
                </span>
                <span className="truncate font-medium">{workspaceName}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52" side="bottom">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Current workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <WorkspaceLogo
                    alt={`${workspaceName} logo`}
                    src={resolvedLogoSrc}
                  />
                  <span className="truncate">{workspaceName}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
