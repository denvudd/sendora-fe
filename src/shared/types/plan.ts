import type { Feature, Plan, PlanFeature } from '@prisma/client'

export interface PlanWithFeatures extends Plan {
  features: (PlanFeature & { feature: Feature })[]
}
