export const PLAN_FEATURE_CODE = {
  MAX_DOMAINS: 'MAX_DOMAINS',
  MAX_CONTACTS: 'MAX_CONTACTS',
  MAX_EMAILS_PER_MONTH: 'MAX_EMAILS_PER_MONTH',
} as const

export type PlanFeatureCode =
  (typeof PLAN_FEATURE_CODE)[keyof typeof PLAN_FEATURE_CODE]
