import { LeadStatus } from '@prisma/client'
import { prisma } from '@shared/utils/prisma'

interface WorkspaceParam {
  workspaceId: string
}

export interface DashboardKpis {
  totalLeads: number
  activeLeads: number
  totalBookings: number
  wonLeads: number
}

export interface LeadStatusCount {
  status: LeadStatus
  count: number
}

export interface LeadDailyCount {
  date: string
  count: number
}

const FUNNEL_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.WON,
  LeadStatus.LOST,
]

export async function getDashboardKpis({
  workspaceId,
}: WorkspaceParam): Promise<DashboardKpis> {
  const [totalLeads, activeLeads, totalBookings, wonLeads] = await Promise.all([
    prisma.lead.count({ where: { workspaceId } }),
    prisma.lead.count({
      where: {
        workspaceId,
        status: {
          in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED],
        },
      },
    }),
    prisma.booking.count({ where: { workspaceId } }),
    prisma.lead.count({ where: { workspaceId, status: LeadStatus.WON } }),
  ])

  return { totalLeads, activeLeads, totalBookings, wonLeads }
}

export async function getLeadStatusCounts({
  workspaceId,
}: WorkspaceParam): Promise<LeadStatusCount[]> {
  const rows = await prisma.lead.groupBy({
    by: ['status'],
    where: { workspaceId },
    _count: { _all: true },
  })

  const statusMap = new Map(rows.map(r => [r.status, r._count._all]))

  return FUNNEL_ORDER.map(status => ({
    status,
    count: statusMap.get(status) ?? 0,
  }))
}

export async function getLeadsTrendLast30Days({
  workspaceId,
}: WorkspaceParam): Promise<LeadDailyCount[]> {
  const thirtyDaysAgo = new Date()

  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const leads = await prisma.lead.findMany({
    where: { workspaceId, createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Bucket by UTC date string
  const countMap = new Map<string, number>()

  for (const lead of leads) {
    const day = lead.createdAt.toISOString().slice(0, 10)

    countMap.set(day, (countMap.get(day) ?? 0) + 1)
  }

  // Build 30-entry array with zeros for missing days
  const result: LeadDailyCount[] = []

  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)

    d.setDate(d.getDate() + i)
    const day = d.toISOString().slice(0, 10)

    result.push({ date: day, count: countMap.get(day) ?? 0 })
  }

  return result
}
