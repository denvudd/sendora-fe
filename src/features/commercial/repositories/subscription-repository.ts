import {
  type BillingInterval,
  type WorkspaceSubscriptionStatus,
} from '@prisma/client'
import { prisma } from '@shared/utils/prisma'

interface CreateSubscriptionParams {
  workspaceId: string
  planId: string
  billingInterval: BillingInterval
  status: WorkspaceSubscriptionStatus
  stripeSubscriptionId?: string
  stripePriceId?: string
  currentPeriodStartAt?: Date
  currentPeriodEndAt?: Date
}

interface UpdateSubscriptionParams {
  subscriptionId: string
  status?: WorkspaceSubscriptionStatus
  stripePriceId?: string | null
  currentPeriodStartAt?: Date
  currentPeriodEndAt?: Date
  cancelAtPeriodEnd?: boolean
  planId?: string
  billingInterval?: BillingInterval
  pendingPlanId?: string | null
  pendingBillingInterval?: BillingInterval | null
  pendingStripePriceId?: string | null
  stripeScheduleId?: string | null
}

interface FindActiveSubscriptionParams {
  workspaceId: string
}

interface FindSubscriptionByStripeIdParams {
  stripeSubscriptionId: string
}

interface CancelSubscriptionParams {
  subscriptionId: string
  cancelAtPeriodEnd: boolean
}

export async function createSubscription({
  workspaceId,
  planId,
  billingInterval,
  status,
  stripeSubscriptionId,
  stripePriceId,
  currentPeriodStartAt,
  currentPeriodEndAt,
}: CreateSubscriptionParams) {
  return prisma.workspaceSubscription.create({
    data: {
      workspaceId,
      planId,
      billingInterval,
      status,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
      stripePriceId: stripePriceId ?? null,
      currentPeriodStartAt: currentPeriodStartAt ?? null,
      currentPeriodEndAt: currentPeriodEndAt ?? null,
    },
    include: {
      plan: {
        include: {
          features: { include: { feature: true } },
        },
      },
    },
  })
}

export async function findActiveSubscriptionByWorkspaceId({
  workspaceId,
}: FindActiveSubscriptionParams) {
  return prisma.workspaceSubscription.findFirst({
    where: {
      workspaceId,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    include: {
      plan: {
        include: {
          features: { include: { feature: true } },
        },
      },
      pendingPlan: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findSubscriptionByStripeId({
  stripeSubscriptionId,
}: FindSubscriptionByStripeIdParams) {
  return prisma.workspaceSubscription.findUnique({
    where: { stripeSubscriptionId },
    include: { workspace: true, plan: true },
  })
}

export async function updateSubscription({
  subscriptionId,
  status,
  stripePriceId,
  currentPeriodStartAt,
  currentPeriodEndAt,
  cancelAtPeriodEnd,
  planId,
  billingInterval,
  pendingPlanId,
  pendingBillingInterval,
  pendingStripePriceId,
  stripeScheduleId,
}: UpdateSubscriptionParams) {
  return prisma.workspaceSubscription.update({
    where: { id: subscriptionId },
    data: {
      ...(status !== undefined && { status }),
      ...(stripePriceId !== undefined && { stripePriceId }),
      ...(currentPeriodStartAt !== undefined && { currentPeriodStartAt }),
      ...(currentPeriodEndAt !== undefined && { currentPeriodEndAt }),
      ...(cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd }),
      ...(planId !== undefined && { planId }),
      ...(billingInterval !== undefined && { billingInterval }),
      ...(pendingPlanId !== undefined && { pendingPlanId }),
      ...(pendingBillingInterval !== undefined && { pendingBillingInterval }),
      ...(pendingStripePriceId !== undefined && { pendingStripePriceId }),
      ...(stripeScheduleId !== undefined && { stripeScheduleId }),
    },
  })
}

export async function cancelSubscription({
  subscriptionId,
  cancelAtPeriodEnd,
}: CancelSubscriptionParams) {
  return prisma.workspaceSubscription.update({
    where: { id: subscriptionId },
    data: {
      cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? 'ACTIVE' : 'CANCELLED',
    },
  })
}
