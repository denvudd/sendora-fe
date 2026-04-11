import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'

import { env } from '@/env'
import { stripe } from '@/shared/lib/stripe'

export async function POST() {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace?.stripeCustomerId) {
    return Response.json({ error: 'No billing account found' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  return Response.json({ url: session.url })
}
