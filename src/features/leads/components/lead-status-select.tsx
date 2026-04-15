'use client'

import type { ReactElement } from 'react'

import { updateLeadStatusAction } from '@features/leads/actions/update-lead-status-action'
import { LeadStatus } from '@prisma/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: LeadStatus.NEW, label: 'New' },
  { value: LeadStatus.CONTACTED, label: 'Contacted' },
  { value: LeadStatus.QUALIFIED, label: 'Qualified' },
  { value: LeadStatus.WON, label: 'Won' },
  { value: LeadStatus.LOST, label: 'Lost' },
]

interface LeadStatusSelectProps {
  leadId: string
  status: LeadStatus
}

export function LeadStatusSelect({
  leadId,
  status,
}: LeadStatusSelectProps): ReactElement {
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(status)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(value: LeadStatus | null): void {
    if (!value) {
      return
    }

    const previousStatus = currentStatus

    setCurrentStatus(value)

    startTransition(async () => {
      const result = await updateLeadStatusAction(leadId, value)

      if (!result.success) {
        setCurrentStatus(previousStatus)
        toast.error(result.message ?? 'Failed to update status.')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Select
      disabled={isPending}
      value={currentStatus}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map(s => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
