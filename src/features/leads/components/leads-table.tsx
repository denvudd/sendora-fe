import type { LeadWithSession } from '../utils'
import type { ReactElement } from 'react'

import { LeadStatusBadge } from '@features/leads/components/lead-status-badge'
import { Button } from '@shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table'
import { ROUTES } from '@shared/constants/routes'
import { format } from 'date-fns'
import { Users2 } from 'lucide-react'
import Link from 'next/link'

interface LeadsTableProps {
  leads: LeadWithSession[]
}

export function LeadsTable({ leads }: LeadsTableProps): ReactElement {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Users2 className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">No leads yet</p>
          <p className="text-sm text-muted-foreground">
            Leads will appear here automatically once a visitor fills in their
            contact details during the appointment booking flow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map(lead => {
          const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ')
          const sourceHostname =
            lead.sessions[0]?.chatbot.domain.hostname ?? lead.source ?? '—'

          return (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {name.length > 0 ? name : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lead.email}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {sourceHostname}
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(lead.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Button
                  render={<Link href={`${ROUTES.Leads}/${lead.id}`} />}
                  size="sm"
                  variant="outline"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
