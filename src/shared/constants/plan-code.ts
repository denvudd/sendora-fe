export const PLAN_CODE = {
  STANDARD: 'STANDARD',
  PLUS: 'PLUS',
  ULTIMATE: 'ULTIMATE',
} as const

export type PlanCode = (typeof PLAN_CODE)[keyof typeof PLAN_CODE]
