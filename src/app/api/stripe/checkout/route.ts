import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateWorkspaceStripeCustomerId,
} from '@features/commercial/repositories'
import { findPlanById } from '@features/home/repositories/plan-repository'
import { type NextRequest } from 'next/server'

import { env } from '@/env'
import { ROUTES } from '@/shared/constants/routes'
import { stripe } from '@/shared/lib/stripe'

interface CheckoutRequestBody {
  workspaceId: string
  planId: string
  billingInterval: 'MONTHLY' | 'YEARLY'
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as CheckoutRequestBody
  const { workspaceId, planId, billingInterval } = body

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace || workspace.id !== workspaceId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plan = await findPlanById({ id: planId })

  if (!plan) {
    return Response.json({ error: 'Plan not found' }, { status: 404 })
  }

  const stripePriceId =
    billingInterval === 'YEARLY'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly

  if (!stripePriceId) {
    return Response.json(
      { error: 'No Stripe price configured for this plan' },
      { status: 400 },
    )
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

  const appUrl = env.NEXT_PUBLIC_APP_URL

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${appUrl}${ROUTES.Dashboard}?subscription=success`,
    cancel_url: `${appUrl}${ROUTES.Onboarding}`,
    metadata: {
      workspaceId,
      planId,
      billingInterval,
    },
    subscription_data: {
      metadata: { workspaceId, planId },
    },
  })

  return Response.json({ url: session.url })
}
