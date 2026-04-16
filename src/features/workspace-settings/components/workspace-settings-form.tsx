'use client'

import type { Workspace } from '@prisma/client'
import type { ReactElement } from 'react'

import { updateWorkspaceAction } from '@features/workspace-settings/actions/update-workspace-action'
import { Button } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import { Field, FieldError } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { UploadcareUploader } from '@shared/components/ui/uploadcare-uploader'
import { useActionState, useEffect, useRef, useState } from 'react'

interface WorkspaceSettingsFormProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug' | 'logoUrl'>
}

interface UpdateWorkspaceFormState {
  errors?: {
    name?: string[]
    slug?: string[]
    logoUrl?: string[]
  }
  message?: string
  success?: boolean
}

/** Maps workspace display name to a slug (lowercase, hyphens, max 48). */
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

export function WorkspaceSettingsForm({
  workspace,
}: WorkspaceSettingsFormProps): ReactElement {
  const [state, action, isPending] = useActionState<
    UpdateWorkspaceFormState,
    FormData
  >(updateWorkspaceAction, {})

  const [name, setName] = useState(workspace.name)
  const [slug, setSlug] = useState(workspace.slug)
  const [logoUrl, setLogoUrl] = useState(workspace.logoUrl ?? '')
  const [successVisible, setSuccessVisible] = useState(false)
  const isSlugManuallyEditedRef = useRef(false)

  useEffect(() => {
    if (state.success) {
      setSuccessVisible(true)
      const timer = setTimeout(() => setSuccessVisible(false), 3000)

      return () => clearTimeout(timer)
    }
  }, [state.success])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace settings</CardTitle>
        <CardDescription>
          Update your workspace name, slug, and logo.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-6">
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
                setName(nextName)

                if (!isSlugManuallyEditedRef.current) {
                  setSlug(deriveWorkspaceSlugFromName(nextName))
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
                setSlug(e.target.value)
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
            onCdnUrlChange={setLogoUrl}
          />

          {state.message && <FieldError>{state.message}</FieldError>}

          {successVisible && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Workspace updated successfully.
            </p>
          )}

          <Button
            className="w-full sm:w-auto"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
