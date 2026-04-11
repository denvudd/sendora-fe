import type Stripe from 'stripe'

import {
  createSubscription,
  findSubscriptionByStripeId,
  updateSubscription,
} from '@features/commercial/repositories'
import { type NextRequest } from 'next/server'

import { env } from '@/env'
import { stripe } from '@/shared/lib/stripe'

export const dynamic = 'force-dynamic'

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'trialing':
      return 'TRIALING'
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE'
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELLED'
    default:
      return 'ACTIVE'
  }
}

/** Get billing period from the first subscription item (Stripe v22 API). */
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodStartAt: Date | undefined
  currentPeriodEndAt: Date | undefined
} {
  const item = subscription.items?.data?.[0]

  if (!item) {
    return { currentPeriodStartAt: undefined, currentPeriodEndAt: undefined }
  }

  return {
    currentPeriodStartAt: new Date(item.current_period_start * 1000),
    currentPeriodEndAt: new Date(item.current_period_end * 1000),
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== 'subscription') {
    return
  }

  const { workspaceId, planId, billingInterval } = session.metadata ?? {}

  if (!workspaceId || !planId || !billingInterval) {
    return
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  )

  const existing = await findSubscriptionByStripeId({
    stripeSubscriptionId: stripeSubscription.id,
  })

  if (existing) {
    return
  }

  const { currentPeriodStartAt, currentPeriodEndAt } =
    getSubscriptionPeriod(stripeSubscription)

  await createSubscription({
    workspaceId,
    planId,
    billingInterval: billingInterval as 'MONTHLY' | 'YEARLY',
    status: 'ACTIVE',
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: stripeSubscription.items.data[0]?.price.id,
    currentPeriodStartAt,
    currentPeriodEndAt,
  })
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const existing = await findSubscriptionByStripeId({
    stripeSubscriptionId: subscription.id,
  })

  if (!existing) {
    return
  }

  const newPriceId = subscription.items.data[0]?.price.id
  const { currentPeriodStartAt, currentPeriodEndAt } =
    getSubscriptionPeriod(subscription)

  // Check if this update is the scheduled downgrade phase completing
  if (
    existing.pendingStripePriceId &&
    newPriceId === existing.pendingStripePriceId
  ) {
    await updateSubscription({
      subscriptionId: existing.id,
      planId: existing.pendingPlanId ?? undefined,
      billingInterval: existing.pendingBillingInterval ?? undefined,
      stripePriceId: newPriceId,
      status: mapStripeStatus(subscription.status),
      currentPeriodStartAt,
      currentPeriodEndAt,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      // Clear pending fields
      pendingPlanId: null,
      pendingBillingInterval: null,
      pendingStripePriceId: null,
      stripeScheduleId: null,
    })

    return
  }

  await updateSubscription({
    subscriptionId: existing.id,
    status: mapStripeStatus(subscription.status),
    stripePriceId: newPriceId,
    currentPeriodStartAt,
    currentPeriodEndAt,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const existing = await findSubscriptionByStripeId({
    stripeSubscriptionId: subscription.id,
  })

  if (!existing) {
    return
  }

  await updateSubscription({
    subscriptionId: existing.id,
    status: 'CANCELLED',
    cancelAtPeriodEnd: false,
  })
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Stripe v22: subscription is accessed via parent.subscription_details.subscription
  const parent = invoice.parent

  if (parent?.type === 'subscription_details') {
    const sub = parent.subscription_details?.subscription

    if (typeof sub === 'string') {
      return sub
    }

    if (sub && typeof sub === 'object') {
      return sub.id
    }
  }

  return null
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice)

  if (!stripeSubscriptionId) {
    return
  }

  const existing = await findSubscriptionByStripeId({ stripeSubscriptionId })

  if (!existing) {
    return
  }

  await updateSubscription({
    subscriptionId: existing.id,
    status: 'ACTIVE',
  })
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice)

  if (!stripeSubscriptionId) {
    return
  }

  const existing = await findSubscriptionByStripeId({ stripeSubscriptionId })

  if (!existing) {
    return
  }

  await updateSubscription({
    subscriptionId: existing.id,
    status: 'PAST_DUE',
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        )
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        )
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        )
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
    }
  } catch (error) {
    console.error('[stripe webhook]', event.type, error)

    return new Response('Handler error', { status: 500 })
  }

  return new Response(null, { status: 200 })
}
