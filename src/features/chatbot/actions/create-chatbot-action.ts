'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  createChatbot,
  findChatbotByDomainId,
  findDomainById,
  findOrCreateUser,
  findWorkspaceByUserId,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface CreateChatbotState {
  message?: string
  success?: boolean
}

export async function createChatbotAction(
  domainId: string,
  _prevState: CreateChatbotState,
  _formData: FormData,
): Promise<CreateChatbotState> {
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

  const domain = await findDomainById({ domainId, workspaceId: workspace.id })

  if (!domain) {
    return { message: 'Domain not found.' }
  }

  const existingChatbot = await findChatbotByDomainId({ domainId })

  if (existingChatbot) {
    return { message: 'A chatbot already exists for this domain.' }
  }

  try {
    await createChatbot({ domainId })
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  revalidatePath(`/domains/${domainId}`)

  return { success: true }
}
