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
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { env } from '@/env'
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
    redirect('/sign-in')
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/sign-in')
  }

  const planId = formData.get('planId') as string
  const billingInterval = formData.get('billingInterval') as
    | 'MONTHLY'
    | 'YEARLY'

  if (!planId || !billingInterval) {
    return { message: 'Invalid request.' }
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect('/onboarding')
  }

  const plan = await findPlanById({ id: planId })

  if (!plan) {
    return { message: 'Plan not found.' }
  }

  const currentSubscription = await findActiveSubscriptionByWorkspaceId({
    workspaceId: workspace.id,
  })

  // Downgrading to free plan
  if (plan.monthlyPriceCents === 0) {
    if (currentSubscription?.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(
        currentSubscription.stripeSubscriptionId,
      )
    }

    await createSubscription({
      workspaceId: workspace.id,
      planId,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    })

    revalidatePath('/settings/billing')

    return {}
  }

  // Upgrading or switching paid plans
  const stripePriceId =
    billingInterval === 'YEARLY'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly

  if (!stripePriceId) {
    return {
      message: 'This plan is not yet available for purchase.',
    }
  }

  // If there's an existing Stripe subscription, update it in-place
  if (currentSubscription?.stripeSubscriptionId) {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId,
    )

    const itemId = stripeSubscription.items.data[0]?.id

    await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [{ id: itemId, price: stripePriceId }],
        proration_behavior: 'create_prorations',
      },
    )

    await updateSubscription({
      subscriptionId: currentSubscription.id,
      planId,
      stripePriceId,
      billingInterval,
    })

    revalidatePath('/settings/billing')

    return {}
  }

  // No existing subscription — start new Stripe checkout
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
    success_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing?subscription=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing`,
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
