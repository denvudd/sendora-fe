'use client'

import type { Domain, LeadStatus } from '@prisma/client'
import type { ReactElement } from 'react'

import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
]

interface LeadsFiltersProps {
  domains: Pick<Domain, 'id' | 'hostname'>[]
}

export function LeadsFilters({ domains }: LeadsFiltersProps): ReactElement {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentDomainId = searchParams.get('domainId') ?? ''
  const currentStatus = searchParams.get('status') ?? ''
  const currentDateFrom = searchParams.get('dateFrom') ?? ''
  const currentDateTo = searchParams.get('dateTo') ?? ''

  const hasFilters =
    currentDomainId !== '' ||
    currentStatus !== '' ||
    currentDateFrom !== '' ||
    currentDateTo !== ''

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  function clearFilters(): void {
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Domain filter */}
      {domains.length > 0 && (
        <div className="flex min-w-[160px] flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Domain</Label>
          <Select
            value={currentDomainId}
            onValueChange={val =>
              updateParam('domainId', !val || val === 'all' ? '' : val)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {domains.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  {d.hostname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status filter */}
      <div className="flex min-w-[140px] flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={currentStatus}
          onValueChange={val =>
            updateParam('status', !val || val === 'all' ? '' : val)
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date from */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          className="h-9 w-36"
          type="date"
          value={currentDateFrom}
          onChange={e => updateParam('dateFrom', e.target.value)}
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          className="h-9 w-36"
          type="date"
          value={currentDateTo}
          onChange={e => updateParam('dateTo', e.target.value)}
        />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          className="h-9"
          size="sm"
          variant="ghost"
          onClick={clearFilters}
        >
          <X className="mr-1.5 size-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}
