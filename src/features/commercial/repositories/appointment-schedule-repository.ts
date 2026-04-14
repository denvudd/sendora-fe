import { prisma } from '@shared/utils/prisma'

interface UpsertAppointmentScheduleParams {
  workspaceId: string
  isEnabled: boolean
  slotDuration: number
  bufferMinutes: number
  timezone: string
  schedule: Record<string, string[]>
}

export async function upsertAppointmentSchedule({
  workspaceId,
  isEnabled,
  slotDuration,
  bufferMinutes,
  timezone,
  schedule,
}: UpsertAppointmentScheduleParams) {
  return prisma.appointmentSchedule.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      isEnabled,
      slotDuration,
      bufferMinutes,
      timezone,
      schedule,
    },
    update: { isEnabled, slotDuration, bufferMinutes, timezone, schedule },
  })
}

interface FindAppointmentScheduleParams {
  workspaceId: string
}

export async function findAppointmentScheduleByWorkspaceId({
  workspaceId,
}: FindAppointmentScheduleParams) {
  return prisma.appointmentSchedule.findUnique({
    where: { workspaceId },
  })
}
