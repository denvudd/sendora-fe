import type { ReactElement } from 'react'

import { auth, currentUser } from '@clerk/nextjs/server'
import { AppointmentScheduleForm } from '@features/appointments/components/appointment-schedule-form'
import { AppointmentsList } from '@features/appointments/components/appointments-list'
import {
  findAppointmentScheduleByWorkspaceId,
  findOrCreateUser,
  findWorkspaceByUserId,
  listUpcomingBookingsWithLeads,
} from '@features/commercial/repositories'
import { redirect } from 'next/navigation'

import { ROUTES } from '@/shared/constants/routes'

const AppointmentsPage = async (): Promise<ReactElement> => {
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

  const [schedule, bookings] = await Promise.all([
    findAppointmentScheduleByWorkspaceId({ workspaceId: workspace.id }),
    listUpcomingBookingsWithLeads({
      workspaceId: workspace.id,
      from: new Date(),
    }),
  ])

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your availability and view upcoming bookings from the chatbot
          portal.
        </p>
      </div>

      <AppointmentScheduleForm schedule={schedule} />
      <AppointmentsList bookings={bookings} />
    </div>
  )
}

export default AppointmentsPage
