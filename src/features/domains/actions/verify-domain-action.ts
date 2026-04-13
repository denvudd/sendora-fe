'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findDomainById,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateDomainVerification,
} from '@features/commercial/repositories'
import {
  checkMetaTag,
  fetchDomainHtml,
} from '@features/domains/lib/check-domain-meta-tag'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface VerifyDomainState {
  message?: string
  success?: boolean
}

export async function verifyDomainAction(
  domainId: string,
  _prevState: VerifyDomainState,
  _formData: FormData,
): Promise<VerifyDomainState> {
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

  const domain = await findDomainById({ domainId, workspaceId: workspace.id })

  if (!domain) {
    return { message: 'Domain not found.' }
  }

  if (!domain.verificationToken) {
    return {
      message: 'This domain has no verification token. Please contact support.',
    }
  }

  if (domain.isVerified) {
    return { success: true }
  }

  const html = await fetchDomainHtml(domain.hostname)

  if (!html) {
    return {
      message: `Could not reach https://${domain.hostname}. Make sure the site is publicly accessible and try again.`,
    }
  }

  const tokenFound = checkMetaTag(html, domain.verificationToken)

  if (!tokenFound) {
    return {
      message: `Verification tag not found on https://${domain.hostname}. Make sure you added the meta tag to the <head> of your page and the site is live.`,
    }
  }

  await updateDomainVerification({
    domainId,
    workspaceId: workspace.id,
    isVerified: true,
    verifiedAt: new Date(),
  })

  revalidatePath(`/domains/${domainId}`)

  return { success: true }
}
