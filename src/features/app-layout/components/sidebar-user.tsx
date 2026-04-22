'use client'

import type { ReactElement } from 'react'

import { UserButton } from '@clerk/nextjs'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar'

export function SidebarUser(): ReactElement {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem className="[&_.cl-userButtonBox]:flex-row-reverse! [&_.cl-userButtonTrigger]:px-2! [&_.cl-userButtonOuterIdentifier]:pl-0!">
          <UserButton showName />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
