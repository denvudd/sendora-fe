'use server'

import { answersSchema } from '@features/appointments/schemas'
import { prisma } from '@shared/utils/prisma'

interface SaveSessionAnswersResult {
  success: boolean
  message?: string
}

export async function saveSessionAnswersAction(
  portalToken: string,
  answers: Record<string, string>,
): Promise<SaveSessionAnswersResult> {
  const validated = answersSchema.safeParse({ portalToken, answers })

  if (!validated.success) {
    return { success: false, message: 'Invalid input.' }
  }

  const session = await prisma.chatSession.findUnique({
    where: { portalToken: validated.data.portalToken },
    select: { id: true, metadata: true },
  })

  if (!session) {
    return { success: false, message: 'Session not found.' }
  }

  const existing =
    session.metadata &&
    typeof session.metadata === 'object' &&
    !Array.isArray(session.metadata)
      ? (session.metadata as Record<string, unknown>)
      : {}

  await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      metadata: { ...existing, answers: validated.data.answers },
    },
  })

  return { success: true }
}
