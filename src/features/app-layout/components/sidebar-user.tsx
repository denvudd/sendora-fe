'use client'

import type { ReactElement } from 'react'

import { useClerk, useUser } from '@clerk/nextjs'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar'
import { ChevronsUpDown, LogOut } from 'lucide-react'

export function SidebarUser(): ReactElement {
  const { user } = useUser()
  const { signOut } = useClerk()

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || 'U'

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
              <Avatar size="sm">
                <AvatarImage alt={fullName} src={user?.imageUrl} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start gap-0.5 leading-none overflow-hidden">
                <span className="truncate font-medium text-sm">{fullName}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => signOut({ redirectUrl: '/sign-in' })}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
