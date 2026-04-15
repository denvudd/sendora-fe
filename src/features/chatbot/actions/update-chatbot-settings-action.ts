'use server'

import type {
  ChatbotBorderRadius,
  ChatbotButtonStyle,
  ChatbotTheme,
} from '@prisma/client'

import { auth, currentUser } from '@clerk/nextjs/server'
import { chatbotSettingsSchema } from '@features/chatbot/schemas'
import {
  findDomainById,
  findOrCreateUser,
  findWorkspaceByUserId,
  updateChatbot,
} from '@features/commercial/repositories'
import { getOptionalTrimmedString } from '@shared/utils/form-data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface UpdateChatbotSettingsState {
  errors?: {
    welcomeMessage?: string[]
    primaryColor?: string[]
    buttonStyle?: string[]
    borderRadius?: string[]
    theme?: string[]
    chatTitle?: string[]
    chatSubtitle?: string[]
    systemPrompt?: string[]
  }
  message?: string
  success?: boolean
}

export async function updateChatbotSettingsAction(
  chatbotId: string,
  domainId: string,
  _prevState: UpdateChatbotSettingsState,
  formData: FormData,
): Promise<UpdateChatbotSettingsState> {
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
    redirect(ROUTES.Onboarding)
  }

  const domain = await findDomainById({ domainId, workspaceId: workspace.id })

  if (!domain) {
    return { message: 'Domain not found.' }
  }

  const isActiveRaw = formData.get('isActive')

  const validated = chatbotSettingsSchema.safeParse({
    welcomeMessage: getOptionalTrimmedString(formData, 'welcomeMessage'),
    primaryColor: getOptionalTrimmedString(formData, 'primaryColor'),
    buttonStyle: formData.get('buttonStyle'),
    borderRadius: formData.get('borderRadius'),
    theme: formData.get('theme'),
    chatTitle: getOptionalTrimmedString(formData, 'chatTitle'),
    chatSubtitle: getOptionalTrimmedString(formData, 'chatSubtitle'),
    systemPrompt: getOptionalTrimmedString(formData, 'systemPrompt'),
    isActive: isActiveRaw === 'on' || isActiveRaw === 'true',
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await updateChatbot({
      chatbotId,
      domainId,
      welcomeMessage: validated.data.welcomeMessage,
      primaryColor: validated.data.primaryColor || undefined,
      buttonStyle: validated.data.buttonStyle as ChatbotButtonStyle,
      borderRadius: validated.data.borderRadius as
        | ChatbotBorderRadius
        | undefined,
      theme: validated.data.theme as ChatbotTheme | undefined,
      chatTitle: validated.data.chatTitle || undefined,
      chatSubtitle: validated.data.chatSubtitle || undefined,
      systemPrompt: validated.data.systemPrompt || undefined,
      isActive: validated.data.isActive,
    })
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  revalidatePath(`/domains/${domainId}`)

  return { success: true }
}
