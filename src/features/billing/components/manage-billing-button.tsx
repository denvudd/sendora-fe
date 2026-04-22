'use client'

import type { ReactElement } from 'react'

import { Button } from '@shared/components/ui/button'
import { useState } from 'react'

export function ManageBillingButton(): ReactElement {
  const [isPending, setIsPending] = useState(false)

  async function handleClick() {
    setIsPending(true)

    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }

      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      disabled={isPending}
      size="sm"
      variant="outline"
      onClick={handleClick}
    >
      {isPending ? 'Loading…' : 'Manage billing'}
    </Button>
  )
}
