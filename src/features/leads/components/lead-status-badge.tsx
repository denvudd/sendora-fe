import type { ReactElement } from 'react'

import { LeadStatus } from '@prisma/client'
import { Badge } from '@shared/components/ui/badge'

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'New',
  [LeadStatus.CONTACTED]: 'Contacted',
  [LeadStatus.QUALIFIED]: 'Qualified',
  [LeadStatus.WON]: 'Won',
  [LeadStatus.LOST]: 'Lost',
}

const STATUS_VARIANTS: Record<
  LeadStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  [LeadStatus.NEW]: 'secondary',
  [LeadStatus.CONTACTED]: 'outline',
  [LeadStatus.QUALIFIED]: 'default',
  [LeadStatus.WON]: 'default',
  [LeadStatus.LOST]: 'destructive',
}

interface LeadStatusBadgeProps {
  status: LeadStatus
}

export function LeadStatusBadge({
  status,
}: LeadStatusBadgeProps): ReactElement {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  )
}
