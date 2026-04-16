'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  updateWorkspaceGoogleTokens,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface DisconnectGoogleCalendarResult {
  success: boolean
  message?: string
}

export async function disconnectGoogleCalendarAction(): Promise<DisconnectGoogleCalendarResult> {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect(ROUTES.SignIn)
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect(ROUTES.SignIn)
  }

  const dbUser = await findOrCreateUser({
    clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
  })

  const workspace = await findWorkspaceByUserId({ userId: dbUser.id })

  if (!workspace) {
    return { success: false, message: 'Workspace not found.' }
  }

  try {
    await updateWorkspaceGoogleTokens({
      workspaceId: workspace.id,
      refreshToken: null,
      enabled: false,
    })
  } catch {
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    }
  }

  revalidatePath(ROUTES.Appointments)

  return { success: true }
}
