export const ROUTES = {
  Dashboard: '/dashboard',
  Conversations: '/conversations',
  Leads: '/leads',
  Settings: '/settings',
  Billing: '/settings/billing',
  WorkspaceSettings: '/settings/workspace',
  Appointments: '/appointments',

  // Auth routes
  SignUp: '/sign-up',
  SignIn: '/sign-in',
  Onboarding: '/onboarding',
} as const

export const chatbotWidget = (domainId: string) =>
  `/chatbot/${domainId}` as const
export const portalPage = (token: string) => `/portal/${token}` as const
export const chatApi = (domainId: string) => `/api/chat/${domainId}` as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export interface NavItem {
  label: string
  href: AppRoute
  icon:
    | 'LayoutGrid'
    | 'MessageSquare'
    | 'Users2'
    | 'Puzzle'
    | 'Settings'
    | 'Calendar'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.Dashboard, icon: 'LayoutGrid' },
  { label: 'Conversations', href: ROUTES.Conversations, icon: 'MessageSquare' },
  { label: 'Leads', href: ROUTES.Leads, icon: 'Users2' },
  { label: 'Appointments', href: ROUTES.Appointments, icon: 'Calendar' },
  { label: 'Settings', href: ROUTES.Settings, icon: 'Settings' },
]
