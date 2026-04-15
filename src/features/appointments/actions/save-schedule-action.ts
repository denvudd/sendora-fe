'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { scheduleSchema } from '@features/appointments/schemas'
import {
  findOrCreateUser,
  findWorkspaceByUserId,
  upsertAppointmentSchedule,
} from '@features/commercial/repositories'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface SaveScheduleState {
  message?: string
  success?: boolean
}

export async function saveScheduleAction(data: {
  isEnabled: boolean
  slotDuration: number
  bufferMinutes: number
  timezone: string
  schedule: Record<string, string[]>
}): Promise<SaveScheduleState> {
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
    return { message: 'No workspace found. Please complete onboarding first.' }
  }

  const validated = scheduleSchema.safeParse(data)

  if (!validated.success) {
    return { message: 'Invalid schedule data. Please check your inputs.' }
  }

  try {
    await upsertAppointmentSchedule({
      workspaceId: workspace.id,
      isEnabled: validated.data.isEnabled,
      slotDuration: validated.data.slotDuration,
      bufferMinutes: validated.data.bufferMinutes,
      timezone: validated.data.timezone,
      schedule: validated.data.schedule,
    })
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/appointments')

  return { success: true }
}
