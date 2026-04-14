import type { ReactElement } from 'react'

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@shared/components/ui/sidebar'
import { ROUTES } from '@shared/constants/routes'
import Link from 'next/link'

import { Image } from '@/shared/components/ui/image'

export function SidebarLogo(): ReactElement {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href={ROUTES.Dashboard} />}
            size="lg"
          >
            <Image
              alt="Sendora"
              height={100}
              src="/images/logo.png"
              width={100}
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
