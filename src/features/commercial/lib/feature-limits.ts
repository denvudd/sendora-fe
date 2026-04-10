import { findActiveSubscriptionByWorkspaceId } from '@features/commercial/repositories/subscription-repository'
import { findPlanByCode } from '@features/home/repositories/plan-repository'
import { prisma } from '@shared/utils/prisma'

export type FeatureCode =
  | 'MAX_DOMAINS'
  | 'MAX_CONTACTS'
  | 'MAX_EMAILS_PER_MONTH'

export type EffectiveLimits = Record<FeatureCode, number | null>

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
    const standardPlan = await findPlanByCode({ code: 'STANDARD' })
    planFeatures = (standardPlan?.features ?? []).map(pf => ({
      code: pf.feature.code,
      limitValue: pf.limitValue ?? null,
      isEnabled: pf.isEnabled,
    }))
  }

  const overrideMap = new Map(overrides.map(o => [o.feature.code, o]))

  function resolveLimit(code: FeatureCode): number | null {
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
    MAX_DOMAINS: resolveLimit('MAX_DOMAINS'),
    MAX_CONTACTS: resolveLimit('MAX_CONTACTS'),
    MAX_EMAILS_PER_MONTH: resolveLimit('MAX_EMAILS_PER_MONTH'),
  }
}

interface CheckFeatureAllowedParams {
  workspaceId: string
  featureCode: FeatureCode
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
