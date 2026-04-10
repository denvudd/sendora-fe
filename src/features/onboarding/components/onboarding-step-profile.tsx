'use client'

import type { ReactElement } from 'react'

import { updateUserAction } from '@features/onboarding/actions/update-user-action'
import { Button } from '@shared/components/ui/button'
import { Field, FieldError } from '@shared/components/ui/field'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { UploadcareUploader } from '@shared/components/ui/uploadcare-uploader'
import { useActionState, useEffect, useRef } from 'react'

import { CardContent, CardFooter } from '@/shared/components/ui/card'

interface OnboardingStepProfileProps {
  firstName: string
  lastName: string
  imageUrl: string
  onContinueSuccess: () => void
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onImageUrlChange: (value: string) => void
}

interface ProfileFormState {
  success?: boolean
  errors?: {
    firstName?: string[]
    lastName?: string[]
    imageUrl?: string[]
  }
  message?: string
}

export function OnboardingStepProfile({
  firstName,
  lastName,
  imageUrl,
  onContinueSuccess,
  onFirstNameChange,
  onLastNameChange,
  onImageUrlChange,
}: OnboardingStepProfileProps): ReactElement {
  const [state, action, isPending] = useActionState<ProfileFormState, FormData>(
    updateUserAction,
    {},
  )

  const didFireSuccessNavigation = useRef(false)

  useEffect(() => {
    if (state.success && !didFireSuccessNavigation.current) {
      didFireSuccessNavigation.current = true
      onContinueSuccess()
    }
  }, [state.success, onContinueSuccess])

  return (
    <form action={action}>
      <CardContent className="space-y-4">
        <Field data-invalid={!!state.errors?.firstName}>
          <Label htmlFor="firstName">First name</Label>
          <Input
            autoComplete="given-name"
            id="firstName"
            name="firstName"
            placeholder="Jane"
            value={firstName}
            required
            onChange={e => {
              onFirstNameChange(e.target.value)
            }}
          />
          {state.errors?.firstName && (
            <FieldError>{state.errors.firstName[0]}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!state.errors?.lastName}>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            autoComplete="family-name"
            id="lastName"
            name="lastName"
            placeholder="Doe"
            value={lastName}
            required
            onChange={e => {
              onLastNameChange(e.target.value)
            }}
          />
          {state.errors?.lastName && (
            <FieldError>{state.errors.lastName[0]}</FieldError>
          )}
        </Field>

        <UploadcareUploader
          description="(optional)"
          error={state.errors?.imageUrl?.[0]}
          label="Profile photo"
          multiple={false}
          multipleMax={1}
          name="imageUrl"
          previewShape="circle"
          value={imageUrl}
          cloudImageEditorAutoOpen
          onCdnUrlChange={onImageUrlChange}
        />

        {state.message && <FieldError>{state.message}</FieldError>}
      </CardContent>

      <CardFooter className="mt-4">
        <Button className="w-full" disabled={isPending} size="lg" type="submit">
          {isPending ? 'Saving…' : 'Continue'}
        </Button>
      </CardFooter>
    </form>
  )
}
