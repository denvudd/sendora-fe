'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findActiveSubscriptionByWorkspaceId,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateSubscription,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'
import { stripe } from '@/shared/lib/stripe'

interface CancelPendingDowngradeState {
  message?: string
}

export async function cancelPendingDowngradeAction(
  _prevState: CancelPendingDowngradeState,
  _formData: FormData,
): Promise<CancelPendingDowngradeState> {
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
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    redirect(ROUTES.Onboarding)
  }

  const subscription = await findActiveSubscriptionByWorkspaceId({
    workspaceId: workspace.id,
  })

  if (!subscription?.stripeScheduleId) {
    return { message: 'No scheduled downgrade found.' }
  }

  try {
    // Release the schedule — the subscription reverts to the current plan
    await stripe.subscriptionSchedules.release(subscription.stripeScheduleId)

    await updateSubscription({
      subscriptionId: subscription.id,
      pendingPlanId: null,
      pendingBillingInterval: null,
      pendingStripePriceId: null,
      stripeScheduleId: null,
    })

    revalidatePath('/settings/billing')

    return {}
  } catch {
    return {
      message: 'Could not cancel the scheduled change. Please try again.',
    }
  }
}
