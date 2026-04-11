'use client'

import type { ReactElement } from 'react'

import { createWorkspaceAction } from '@features/onboarding/actions/create-workspace-action'
import { Button } from '@shared/components/ui/button'
import { ColorPickerField } from '@shared/components/ui/color-picker-field'
import { Field, FieldError } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { UploadcareUploader } from '@shared/components/ui/uploadcare-uploader'
import { useActionState, useEffect, useRef } from 'react'

import { CardContent, CardFooter } from '@/shared/components/ui/card'

interface OnboardingStepWorkspaceProps {
  name: string
  slug: string
  logoUrl: string
  onBack: () => void
  onSuccess: (workspaceId: string) => void
  onNameChange: (value: string) => void
  onSlugChange: (value: string) => void
  onLogoUrlChange: (value: string) => void
}

interface OnboardingFormState {
  errors?: {
    name?: string[]
    slug?: string[]
    logoUrl?: string[]
    primaryColor?: string[]
  }
  message?: string
  workspaceId?: string
}

/** Maps workspace display name to a slug matching createWorkspaceSchema (lowercase, hyphens, max 48). */
function deriveWorkspaceSlugFromName(rawName: string): string {
  return rawName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function OnboardingStepWorkspace({
  name,
  slug,
  logoUrl,
  onBack,
  onSuccess,
  onNameChange,
  onSlugChange,
  onLogoUrlChange,
}: OnboardingStepWorkspaceProps): ReactElement {
  const [state, action, isPending] = useActionState<
    OnboardingFormState,
    FormData
  >(createWorkspaceAction, {})
  const isSlugManuallyEditedRef = useRef(false)

  useEffect(() => {
    if (state.workspaceId) {
      onSuccess(state.workspaceId)
    }
  }, [state.workspaceId, onSuccess])

  return (
    <form action={action}>
      <CardContent className="space-y-4">
        <Field data-invalid={!!state.errors?.name}>
          <Label htmlFor="name">Workspace name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Acme Inc."
            value={name}
            required
            onChange={e => {
              const nextName = e.target.value
              onNameChange(nextName)

              if (!isSlugManuallyEditedRef.current) {
                onSlugChange(deriveWorkspaceSlugFromName(nextName))
              }
            }}
          />
          {state.errors?.name && (
            <FieldError>{state.errors.name[0]}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!state.errors?.slug}>
          <Label htmlFor="slug">Workspace slug</Label>
          <Input
            id="slug"
            name="slug"
            placeholder="acme-inc"
            value={slug}
            required
            onChange={e => {
              isSlugManuallyEditedRef.current = true
              onSlugChange(e.target.value)
            }}
          />
          {state.errors?.slug && (
            <FieldError>{state.errors.slug[0]}</FieldError>
          )}
        </Field>

        <UploadcareUploader
          description="(optional)"
          error={state.errors?.logoUrl?.[0]}
          label="Workspace logo"
          multiple={false}
          multipleMax={1}
          name="logoUrl"
          previewShape="square"
          value={logoUrl}
          cloudImageEditorAutoOpen
          onCdnUrlChange={onLogoUrlChange}
        />

        <ColorPickerField error={state.errors?.primaryColor?.[0]} />

        {state.message && <FieldError>{state.message}</FieldError>}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 mt-4">
        <Button className="w-full" disabled={isPending} size="lg" type="submit">
          {isPending ? 'Creating…' : 'Create workspace'}
        </Button>
        <Button
          className="w-full"
          disabled={isPending}
          size="lg"
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          Back
        </Button>
      </CardFooter>
    </form>
  )
}
