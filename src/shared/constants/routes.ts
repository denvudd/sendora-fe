export const ROUTES = {
  dashboard: '/dashboard',
  conversations: '/conversations',
  integrations: '/integrations',
  settings: '/settings',
  appointments: '/appointments',
  emailMarketing: '/email-marketing',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export interface NavItem {
  label: string
  href: AppRoute
  icon:
    | 'LayoutGrid'
    | 'MessageSquare'
    | 'Puzzle'
    | 'Settings'
    | 'Calendar'
    | 'Mail'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: 'LayoutGrid' },
  { label: 'Conversations', href: ROUTES.conversations, icon: 'MessageSquare' },
  { label: 'Integrations', href: ROUTES.integrations, icon: 'Puzzle' },
  { label: 'Settings', href: ROUTES.settings, icon: 'Settings' },
  { label: 'Appointments', href: ROUTES.appointments, icon: 'Calendar' },
  { label: 'Email Marketing', href: ROUTES.emailMarketing, icon: 'Mail' },
]
