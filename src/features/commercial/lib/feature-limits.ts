import { findActiveSubscriptionByWorkspaceId } from '@features/commercial/repositories/subscription-repository'
import { findPlanByCode } from '@features/home/repositories/plan-repository'
import { prisma } from '@shared/utils/prisma'

import { PLAN_CODE } from '@/shared/constants/plan-code'
import {
  PLAN_FEATURE_CODE,
  type PlanFeatureCode,
} from '@/shared/constants/plan-feature-code'

export type EffectiveLimits = Record<PlanFeatureCode, number | null>

/**
 * Returns effective feature limits for a workspace.
 * Priority: WorkspaceFeature override > active plan features > STANDARD plan fallback.
 * null = unlimited, 0 = disabled.
 */
export async function getEffectiveLimits(
  workspaceId: string,
): Promise<EffectiveLimits> {
  const subscription = await findActiveSubscriptionByWorkspaceId({
    workspaceId,
  })

  const overrides = await prisma.workspaceFeature.findMany({
    where: {
      workspaceId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { feature: true },
  })

  let planFeatures: Array<{
    code: string
    limitValue: number | null
    isEnabled: boolean
  }>

  if (subscription) {
    planFeatures = subscription.plan.features.map(pf => ({
      code: pf.feature.code,
      limitValue: pf.limitValue ?? null,
      isEnabled: pf.isEnabled,
    }))
  } else {
    const standardPlan = await findPlanByCode({ code: PLAN_CODE.STANDARD })
    planFeatures = (standardPlan?.features ?? []).map(pf => ({
      code: pf.feature.code,
      limitValue: pf.limitValue ?? null,
      isEnabled: pf.isEnabled,
    }))
  }

  const overrideMap = new Map(overrides.map(o => [o.feature.code, o]))

  function resolveLimit(code: PlanFeatureCode): number | null {
    const override = overrideMap.get(code)

    if (override) {
      if (!override.isEnabled) {
        return 0
      }

      return override.limitOverride ?? null
    }

    const planFeature = planFeatures.find(pf => pf.code === code)

    if (!planFeature || !planFeature.isEnabled) {
      return 0
    }

    return planFeature.limitValue
  }

  return {
    [PLAN_FEATURE_CODE.MAX_DOMAINS]: resolveLimit(
      PLAN_FEATURE_CODE.MAX_DOMAINS,
    ),
    [PLAN_FEATURE_CODE.MAX_CONTACTS]: resolveLimit(
      PLAN_FEATURE_CODE.MAX_CONTACTS,
    ),
    [PLAN_FEATURE_CODE.MAX_EMAILS_PER_MONTH]: resolveLimit(
      PLAN_FEATURE_CODE.MAX_EMAILS_PER_MONTH,
    ),
  }
}

interface CheckFeatureAllowedParams {
  workspaceId: string
  featureCode: PlanFeatureCode
  currentCount: number
}

interface CheckResult {
  allowed: boolean
  limit: number | null
  currentCount: number
}

/**
 * Returns whether the workspace can perform one more unit of a feature.
 * null limit = unlimited = always allowed.
 * Server-side only — never import in client components.
 */
export async function checkFeatureAllowed({
  workspaceId,
  featureCode,
  currentCount,
}: CheckFeatureAllowedParams): Promise<CheckResult> {
  const limits = await getEffectiveLimits(workspaceId)
  const limit = limits[featureCode]

  return {
    allowed: limit === null || currentCount < limit,
    limit,
    currentCount,
  }
}
