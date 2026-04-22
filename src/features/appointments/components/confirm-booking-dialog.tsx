'use client'

import type { ReactElement, ReactNode } from 'react'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

import { confirmBookingAction } from '../actions/confirm-booking-action'

type MeetingLinkMode = 'none' | 'manual' | 'google'

interface ConfirmBookingDialogProps {
  bookingId: string
  googleCalendarEnabled: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfirmBookingDialog({
  bookingId,
  googleCalendarEnabled,
  open,
  onOpenChange,
}: ConfirmBookingDialogProps): ReactElement {
  const [mode, setMode] = useState<MeetingLinkMode>('none')
  const [manualLink, setManualLink] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(value: boolean): void {
    if (!isPending) {
      onOpenChange(value)

      if (!value) {
        setMode('none')
        setManualLink('')
      }
    }
  }

  function handleConfirm(): void {
    if (mode === 'manual' && manualLink && !isValidUrl(manualLink)) {
      toast.error('Please enter a valid URL.')

      return
    }

    startTransition(async () => {
      const result = await confirmBookingAction({
        bookingId,
        meetingLink: mode === 'manual' ? manualLink || undefined : undefined,
        generateGoogleMeet: mode === 'google',
      })

      if (!result.success) {
        toast.error(result.message ?? 'Failed to confirm booking.')
      } else {
        toast.success('Booking confirmed.')
        onOpenChange(false)
        setMode('none')
        setManualLink('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm appointment</DialogTitle>
          <DialogDescription>
            Optionally add a meeting link that will be sent to the guest in the
            confirmation email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <ModeOption
            active={mode === 'none'}
            description="Confirm without a meeting link"
            label="No meeting link"
            onSelect={() => setMode('none')}
          />

          <ModeOption
            active={mode === 'manual'}
            description="Paste your Zoom, Teams, or any video call link"
            label="Enter link manually"
            onSelect={() => setMode('manual')}
          >
            {mode === 'manual' && (
              <div className="mt-3">
                <Label className="sr-only" htmlFor="manual-link">
                  Meeting link
                </Label>
                <Input
                  id="manual-link"
                  placeholder="https://zoom.us/j/..."
                  type="url"
                  value={manualLink}
                  autoFocus
                  onChange={e => setManualLink(e.target.value)}
                />
              </div>
            )}
          </ModeOption>

          <ModeOption
            active={mode === 'google'}
            description={
              googleCalendarEnabled
                ? 'A Google Meet link will be generated automatically'
                : 'Connect Google Calendar in the settings above to use this option'
            }
            disabled={!googleCalendarEnabled}
            label="Generate via Google Meet"
            onSelect={() => googleCalendarEnabled && setMode('google')}
          />
        </div>

        <DialogFooter>
          <Button
            disabled={isPending}
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleConfirm}>
            {isPending ? 'Confirming…' : 'Confirm booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ModeOptionProps {
  label: string
  description: string
  active: boolean
  disabled?: boolean
  onSelect: () => void
  children?: ReactNode
}

function ModeOption({
  label,
  description,
  active,
  disabled = false,
  onSelect,
  children,
}: ModeOptionProps): ReactElement {
  return (
    <button
      aria-pressed={active}
      className={[
        'w-full rounded-lg border p-4 text-left transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-muted/50',
        active ? 'border-primary bg-primary/5' : 'border-border bg-transparent',
      ].join(' ')}
      disabled={disabled}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
            active ? 'border-primary' : 'border-muted-foreground',
          ].join(' ')}
        >
          {active && <span className="size-2 rounded-full bg-primary" />}
        </span>
        <div>
          <p className="text-sm font-medium leading-none">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </button>
  )
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)

    return true
  } catch {
    return false
  }
}
