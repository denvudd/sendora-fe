'use client'

import type { ReactElement } from 'react'

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar'
import { NAV_ITEMS } from '@shared/constants/routes'
import {
  Calendar,
  LayoutGrid,
  Mail,
  MessageSquare,
  Puzzle,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ICON_MAP = {
  LayoutGrid,
  MessageSquare,
  Puzzle,
  Settings,
  Calendar,
  Mail,
} as const

export function SidebarNav(): ReactElement {
  const pathname = usePathname()

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarMenu>
          {NAV_ITEMS.map(item => {
            const Icon = ICON_MAP[item.icon]
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  render={<Link href={item.href} />}
                  tooltip={item.label}
                >
                  <Icon className="size-6" />
                  <span className="truncate font-medium text-md">
                    {item.label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  )
}
