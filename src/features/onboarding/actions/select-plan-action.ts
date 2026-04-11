'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  createSubscription,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateWorkspaceStripeCustomerId,
} from '@features/commercial/repositories'
import { findPlanById } from '@features/home/repositories/plan-repository'
import { redirect } from 'next/navigation'

import { env } from '@/env'
import { stripe } from '@/shared/lib/stripe'

interface SelectPlanState {
  message?: string
}

export async function selectPlanAction(
  _prevState: SelectPlanState,
  formData: FormData,
): Promise<SelectPlanState> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/sign-in')
  }

  const workspaceId = formData.get('workspaceId') as string
  const planId = formData.get('planId') as string
  const billingInterval = formData.get('billingInterval') as
    | 'MONTHLY'
    | 'YEARLY'

  if (!workspaceId || !planId || !billingInterval) {
    return { message: 'Invalid form data. Please try again.' }
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace || workspace.id !== workspaceId) {
    return { message: 'Workspace not found.' }
  }

  const plan = await findPlanById({ id: planId })

  if (!plan) {
    return { message: 'Plan not found.' }
  }

  // Free plan — create subscription directly and redirect to dashboard
  if (plan.monthlyPriceCents === 0) {
    await createSubscription({
      workspaceId,
      planId,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    })
    redirect('/dashboard')
  }

  // Paid plan — create Stripe checkout session
  const stripePriceId =
    billingInterval === 'YEARLY'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly

  if (!stripePriceId) {
    return {
      message:
        'This plan is not yet available for purchase. Please choose another plan.',
    }
  }

  let stripeCustomerId = workspace.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: workspace.name,
      metadata: { workspaceId },
    })
    stripeCustomerId = customer.id
    await updateWorkspaceStripeCustomerId({ workspaceId, stripeCustomerId })
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/onboarding`,
    metadata: {
      workspaceId,
      planId,
      billingInterval,
    },
    subscription_data: {
      metadata: { workspaceId, planId },
    },
  })

  if (!session.url) {
    return { message: 'Could not create checkout session. Please try again.' }
  }

  redirect(session.url)
}
