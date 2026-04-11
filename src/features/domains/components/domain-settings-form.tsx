'use client'

import type { Domain } from '@prisma/client'
import type { ReactElement } from 'react'

import { updateDomainAction } from '@features/domains/actions/update-domain-action'
import { DeleteDomainButton } from '@features/domains/components/delete-domain-button'
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
import { Separator } from '@shared/components/ui/separator'
import { UploadcareUploader } from '@shared/components/ui/uploadcare-uploader'
import { useActionState, useCallback, useEffect, useState } from 'react'

interface DomainSettingsFormProps {
  domain: Domain
}

interface UpdateDomainState {
  errors?: {
    hostname?: string[]
    iconUrl?: string[]
  }
  message?: string
  success?: boolean
}

const MAX_ICON_SIZE_BYTES = 1024 * 1024 * 2 // 2MB

export function DomainSettingsForm({
  domain,
}: DomainSettingsFormProps): ReactElement {
  const boundAction = useCallback(
    (prevState: UpdateDomainState, formData: FormData) =>
      updateDomainAction(domain.id, prevState, formData),
    [domain.id],
  )

  const [state, action, isPending] = useActionState<
    UpdateDomainState,
    FormData
  >(boundAction, {})

  const [iconUrl, setIconUrl] = useState(domain.iconUrl ?? '')
  const [successVisible, setSuccessVisible] = useState(false)

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuccessVisible(true)
      const timer = setTimeout(() => setSuccessVisible(false), 3000)

      return () => clearTimeout(timer)
    }
  }, [state.success])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain settings</CardTitle>
        <CardDescription>
          Update your domain details and chatbot icon.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-6">
          <input name="iconUrl" type="hidden" value={iconUrl} />

          <Field data-invalid={!!state.errors?.hostname}>
            <Label htmlFor="hostname">Hostname</Label>
            <Input
              defaultValue={domain.hostname}
              id="hostname"
              name="hostname"
              placeholder="example.com"
              required
            />
            {state.errors?.hostname && (
              <FieldError>{state.errors.hostname[0]}</FieldError>
            )}
          </Field>

          <div className="space-y-2">
            <UploadcareUploader
              description="(recommended 300×300px, max 2MB)"
              error={state.errors?.iconUrl?.[0]}
              label="Domain icon"
              maxLocalFileSizeBytes={MAX_ICON_SIZE_BYTES}
              multiple={false}
              multipleMax={1}
              name="iconUrlUploader"
              previewShape="square"
              value={iconUrl}
              onCdnUrlChange={setIconUrl}
            />
          </div>

          {state.message && <FieldError>{state.message}</FieldError>}

          {successVisible && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Settings saved successfully.
            </p>
          )}

          <Button disabled={isPending} type="submit">
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>

        <Separator className="my-6" />

        <div className="space-y-2">
          <p className="text-sm font-medium">Danger zone</p>
          <p className="text-sm text-muted-foreground">
            Deleting this domain will permanently remove it and all associated
            settings. This action cannot be undone.
          </p>
          <DeleteDomainButton domainId={domain.id} hostname={domain.hostname} />
        </div>
      </CardContent>
    </Card>
  )
}
