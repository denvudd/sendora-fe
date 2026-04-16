'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  deleteDomain,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

export async function deleteDomainAction(domainId: string): Promise<void> {
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

  await deleteDomain({ domainId, workspaceId: workspace.id })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
