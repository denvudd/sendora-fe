'use client'

import type { Domain, LeadStatus } from '@prisma/client'
import type { ReactElement } from 'react'

import { Button } from '@shared/components/ui/button'
import { Label } from '@shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { Calendar } from '@/shared/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'

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
    <div className="flex flex-wrap items-end gap-4">
      {/* Domain filter */}
      {domains.length > 0 && (
        <div className="flex flex-col gap-1.5">
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
            <SelectContent className="max-w-[200px]">
              <SelectGroup>
                <SelectLabel>Domains</SelectLabel>
                <SelectItem value="all">All domains</SelectItem>
                {domains.map(d => (
                  <SelectItem key={d.id} className="truncate" value={d.id}>
                    {d.hostname}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-col gap-1.5">
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
            <SelectGroup>
              <SelectLabel>Statuses</SelectLabel>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Date from */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                data-empty={!currentDateFrom}
                variant="outline"
              />
            }
          >
            <CalendarIcon />
            {currentDateFrom ? (
              format(currentDateFrom, 'yyyy-MM-dd')
            ) : (
              <span>YYYY-MM-DD</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDateFrom ? new Date(currentDateFrom) : undefined}
              onSelect={date =>
                updateParam('dateFrom', date ? format(date, 'yyyy-MM-dd') : '')
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                data-empty={!currentDateTo}
                variant="outline"
              />
            }
          >
            <CalendarIcon />
            {currentDateTo ? (
              format(currentDateTo, 'yyyy-MM-dd')
            ) : (
              <span>YYYY-MM-DD</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDateTo ? new Date(currentDateTo) : undefined}
              onSelect={date =>
                updateParam('dateTo', date ? format(date, 'yyyy-MM-dd') : '')
              }
            />
          </PopoverContent>
        </Popover>
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
