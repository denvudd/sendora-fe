'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  generatePortalToken,
} from '@features/commercial/repositories'
import { prisma } from '@shared/utils/prisma'
import { redirect } from 'next/navigation'

interface GeneratePortalLinkState {
  message?: string
  success?: boolean
  url?: string
}

export async function generatePortalLinkAction(
  sessionId: string,
  _prevState: GeneratePortalLinkState,
  _formData: FormData,
): Promise<GeneratePortalLinkState> {
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

  // Verify session belongs to this workspace
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      chatbot: { domain: { workspaceId: workspace.id } },
    },
  })

  if (!session) {
    return { message: 'Session not found.' }
  }

  try {
    const updated = await generatePortalToken({ sessionId })

    return { success: true, url: `/portal/${updated.portalToken}` }
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }
}
