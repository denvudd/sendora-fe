export const ROUTES = {
  Dashboard: '/dashboard',
  Conversations: '/conversations',
  Integrations: '/integrations',
  Settings: '/settings',
  Appointments: '/appointments',
  EmailMarketing: '/email-marketing',

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
    | 'Puzzle'
    | 'Settings'
    | 'Calendar'
    | 'Mail'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.Dashboard, icon: 'LayoutGrid' },
  { label: 'Conversations', href: ROUTES.Conversations, icon: 'MessageSquare' },
  { label: 'Integrations', href: ROUTES.Integrations, icon: 'Puzzle' },
  { label: 'Settings', href: ROUTES.Settings, icon: 'Settings' },
  { label: 'Appointments', href: ROUTES.Appointments, icon: 'Calendar' },
  { label: 'Email Marketing', href: ROUTES.EmailMarketing, icon: 'Mail' },
]
