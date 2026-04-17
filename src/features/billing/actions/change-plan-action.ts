'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  createSubscription,
  findActiveSubscriptionByWorkspaceId,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateSubscription,
  updateWorkspaceStripeCustomerId,
} from '@features/commercial/repositories'
import { findPlanById } from '@features/home/repositories/plan-repository'
import { BillingInterval, WorkspaceSubscriptionStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { env } from '@/env'
import { ROUTES } from '@/shared/constants/routes'
import { stripe } from '@/shared/lib/stripe'

interface ChangePlanState {
  message?: string
}

export async function changePlanAction(
  _prevState: ChangePlanState,
  formData: FormData,
): Promise<ChangePlanState> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect(ROUTES.SignIn)
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect(ROUTES.SignIn)
  }

  const planId = formData.get('planId') as string
  const billingInterval = formData.get('billingInterval') as BillingInterval

  if (!planId || !billingInterval) {
    return { message: 'Invalid request.' }
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  const plan = await findPlanById({ id: planId })

  if (!plan) {
    return { message: 'Plan not found.' }
  }

  const currentSubscription = await findActiveSubscriptionByWorkspaceId({
    workspaceId: workspace.id,
  })

  // ── Downgrade to free plan ───────────────────────────────────────────────
  if (plan.monthlyPriceCents === 0) {
    if (currentSubscription?.stripeSubscriptionId) {
      // Release any existing schedule before cancelling
      if (currentSubscription.stripeScheduleId) {
        await stripe.subscriptionSchedules.release(
          currentSubscription.stripeScheduleId,
        )
      }

      await stripe.subscriptions.cancel(
        currentSubscription.stripeSubscriptionId,
      )
    }

    await createSubscription({
      workspaceId: workspace.id,
      planId,
      billingInterval: BillingInterval.MONTHLY,
      status: WorkspaceSubscriptionStatus.ACTIVE,
    })

    revalidatePath(ROUTES.Billing)

    return {}
  }

  // ── Resolve Stripe price ID ──────────────────────────────────────────────
  const stripePriceId =
    billingInterval === BillingInterval.YEARLY
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly

  if (!stripePriceId) {
    return { message: 'This plan is not yet available for purchase.' }
  }

  // ── Existing Stripe subscription: upgrade or downgrade ──────────────────
  if (currentSubscription?.stripeSubscriptionId) {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId,
    )

    const currentItem = stripeSubscription.items.data[0]
    const itemId = currentItem?.id
    const currentPriceId = currentItem?.price.id
    const currentPeriodStart = currentItem?.current_period_start
    const currentPeriodEnd = currentItem?.current_period_end

    const currentPriceCents = currentSubscription.plan.monthlyPriceCents ?? 0
    const isUpgrade = plan.monthlyPriceCents > currentPriceCents

    if (isUpgrade) {
      // ── UPGRADE: charge immediately ──────────────────────────────────────
      // If there was a pending downgrade schedule, release it first
      if (currentSubscription.stripeScheduleId) {
        await stripe.subscriptionSchedules.release(
          currentSubscription.stripeScheduleId,
        )
      }

      await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [{ id: itemId, price: stripePriceId }],
          proration_behavior: 'always_invoice',
        },
      )

      await updateSubscription({
        subscriptionId: currentSubscription.id,
        planId,
        stripePriceId,
        billingInterval,
        // Clear any pending downgrade
        pendingPlanId: null,
        pendingBillingInterval: null,
        pendingStripePriceId: null,
        stripeScheduleId: null,
      })
    } else {
      // ── DOWNGRADE: schedule at period end ────────────────────────────────
      let scheduleId: string

      if (
        stripeSubscription.schedule &&
        typeof stripeSubscription.schedule === 'string'
      ) {
        // Reuse existing schedule
        scheduleId = stripeSubscription.schedule
      } else if (
        stripeSubscription.schedule &&
        typeof stripeSubscription.schedule === 'object'
      ) {
        scheduleId = stripeSubscription.schedule.id
      } else {
        // Create a new schedule from the current subscription
        const newSchedule = await stripe.subscriptionSchedules.create({
          from_subscription: currentSubscription.stripeSubscriptionId,
        })

        scheduleId = newSchedule.id
      }

      // Set phase 1 = current plan until period end, phase 2 = new plan.
      // start_date on phase 1 is required by Stripe to anchor end_date calculations.
      await stripe.subscriptionSchedules.update(scheduleId, {
        end_behavior: 'release',
        phases: [
          {
            start_date: currentPeriodStart,
            items: [{ price: currentPriceId }],
            end_date: currentPeriodEnd,
          },
          {
            items: [{ price: stripePriceId }],
          },
        ],
      })

      // Store pending downgrade — do NOT change planId yet
      await updateSubscription({
        subscriptionId: currentSubscription.id,
        pendingPlanId: planId,
        pendingBillingInterval: billingInterval,
        pendingStripePriceId: stripePriceId,
        stripeScheduleId: scheduleId,
      })
    }

    revalidatePath(ROUTES.Billing)

    return {}
  }

  // ── No existing Stripe subscription: start checkout ──────────────────────
  let stripeCustomerId = workspace.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: workspace.name,
      metadata: { workspaceId: workspace.id },
    })

    stripeCustomerId = customer.id

    await updateWorkspaceStripeCustomerId({
      workspaceId: workspace.id,
      stripeCustomerId,
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.Billing}?subscription=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.Billing}`,
    metadata: {
      workspaceId: workspace.id,
      planId,
      billingInterval,
    },
    subscription_data: {
      metadata: { workspaceId: workspace.id, planId },
    },
  })

  if (!session.url) {
    return { message: 'Could not create checkout session. Please try again.' }
  }

  redirect(session.url)
}
