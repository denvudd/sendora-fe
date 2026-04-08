'use client'

import type { ReactElement } from 'react'

import { createWorkspaceAction } from '@features/onboarding/actions/create-workspace-action'
import { useActionState } from 'react'

interface OnboardingFormState {
  errors?: {
    name?: string[]
    slug?: string[]
  }
  message?: string
}

export function OnboardingPage(): ReactElement {
  const [state, action, isPending] = useActionState<
    OnboardingFormState,
    FormData
  >(createWorkspaceAction, {})

  return (
    <div
      className="
        w-full max-w-md space-y-6 rounded-2xl border border-border/70 bg-card
        p-8 shadow-sm
      "
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up your Sendora workspace to get started.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            Workspace name
          </label>
          <input
            className="
              w-full rounded-lg border border-input bg-background px-3 py-2
              text-sm outline-none
              focus:border-ring focus:ring-2 focus:ring-ring/20
            "
            id="name"
            name="name"
            placeholder="Acme Inc."
            required
          />
          {state.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="slug">
            Workspace slug
          </label>
          <input
            className="
              w-full rounded-lg border border-input bg-background px-3 py-2
              text-sm outline-none
              focus:border-ring focus:ring-2 focus:ring-ring/20
            "
            id="slug"
            name="slug"
            placeholder="acme-inc"
            required
          />
          {state.errors?.slug && (
            <p className="text-xs text-destructive">{state.errors.slug[0]}</p>
          )}
        </div>

        {state.message && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <button
          className="
            w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium
            text-primary-foreground
            disabled:opacity-50
          "
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Creating…' : 'Create workspace'}
        </button>
      </form>
    </div>
  )
}
