'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { chatbotQuestionsSchema } from '@features/chatbot/schemas'
import {
  findDomainById,
  findOrCreateUser,
  findWorkspaceByUserId,
  replaceQuestions,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

interface UpdateChatbotQuestionsState {
  message?: string
  success?: boolean
}

export async function updateChatbotQuestionsAction(
  chatbotId: string,
  domainId: string,
  _prevState: UpdateChatbotQuestionsState,
  formData: FormData,
): Promise<UpdateChatbotQuestionsState> {
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

  const rawQuestions = formData.get('questions')

  if (typeof rawQuestions !== 'string') {
    return { message: 'Invalid questions data.' }
  }

  let parsedQuestions: unknown

  try {
    parsedQuestions = JSON.parse(rawQuestions)
  } catch {
    return { message: 'Invalid questions format.' }
  }

  const validated = chatbotQuestionsSchema.safeParse({
    questions: parsedQuestions,
  })

  if (!validated.success) {
    return {
      message: validated.error.issues[0]?.message ?? 'Invalid questions.',
    }
  }

  try {
    await replaceQuestions({
      chatbotId,
      questions: validated.data.questions.map((q, index) => ({
        text: q.text,
        sortOrder: index,
      })),
    })
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  revalidatePath(`/domains/${domainId}`)

  return { success: true }
}
