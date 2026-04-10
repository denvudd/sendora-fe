'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  cancelSubscription,
  findActiveSubscriptionByWorkspaceId,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { stripe } from '@/shared/lib/stripe'

interface CancelSubscriptionState {
  message?: string
}

export async function cancelSubscriptionAction(
  _prevState: CancelSubscriptionState,
  _formData: FormData,
): Promise<CancelSubscriptionState> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/sign-in')
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

  const subscription = await findActiveSubscriptionByWorkspaceId({
    workspaceId: workspace.id,
  })

  if (!subscription) {
    return { message: 'No active subscription found.' }
  }

  if (!subscription.stripeSubscriptionId) {
    // Free plan — no Stripe subscription to cancel
    return { message: 'Free plans cannot be cancelled.' }
  }

  try {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await cancelSubscription({
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: true,
    })

    revalidatePath('/settings/billing')

    return {}
  } catch {
    return { message: 'Failed to cancel subscription. Please try again.' }
  }
}
