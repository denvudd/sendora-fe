'use client'

import type { ReactElement } from 'react'

import { updateLeadNotesAction } from '@features/leads/actions/update-lead-notes-action'
import { Button } from '@shared/components/ui/button'
import { Textarea } from '@shared/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface LeadNotesFormProps {
  leadId: string
  initialNotes: string | null
}

export function LeadNotesForm({
  leadId,
  initialNotes,
}: LeadNotesFormProps): ReactElement {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave(): void {
    startTransition(async () => {
      const result = await updateLeadNotesAction(leadId, notes)

      if (!result.success) {
        toast.error(result.message ?? 'Failed to save notes.')
      } else {
        toast.success('Notes saved.')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        className="min-h-[100px] resize-none"
        placeholder="Add notes about this lead..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <Button
        disabled={isPending || notes === (initialNotes ?? '')}
        size="sm"
        onClick={handleSave}
      >
        {isPending ? 'Saving…' : 'Save notes'}
      </Button>
    </div>
  )
}
