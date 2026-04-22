'use client'

import type { ReactElement } from 'react'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/shared/components/ui/badge'
import { Button, buttonVariants } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

import { disconnectGoogleCalendarAction } from '../actions/disconnect-google-calendar-action'

interface GoogleMeetConnectProps {
  isConnected: boolean
}

export function GoogleMeetConnect({
  isConnected,
}: GoogleMeetConnectProps): ReactElement {
  const [isPending, startTransition] = useTransition()

  function handleDisconnect(): void {
    startTransition(async () => {
      const result = await disconnectGoogleCalendarAction()

      if (!result.success) {
        toast.error(result.message ?? 'Failed to disconnect Google Calendar.')
      } else {
        toast.success('Google Calendar disconnected.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Meet Integration</CardTitle>
        <CardDescription>
          Connect your Google account to automatically generate Google Meet
          links when confirming appointments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-green-500/10">
                <svg
                  aria-hidden="true"
                  className="size-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">
                    Google Calendar connected
                  </p>
                  <Badge className="ml-1" variant="default">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Meet links will be generated automatically on confirmation
                </p>
              </div>
            </div>
            <Button
              disabled={isPending}
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
            >
              {isPending ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                <svg
                  aria-hidden="true"
                  className="size-5 text-muted-foreground"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Google Calendar not connected
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect to auto-generate Meet links when confirming bookings
                </p>
              </div>
            </div>
            <a
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              href="/api/google/auth"
            >
              Connect Google
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
