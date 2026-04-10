'use client'

import type { ReactElement } from 'react'

import { OnboardingStepProfile } from '@features/onboarding/components/onboarding-step-profile'
import { OnboardingStepWorkspace } from '@features/onboarding/components/onboarding-step-workspace'
import { Stepper } from '@features/onboarding/lib/onboarding-stepper'
import { profileStepNavigationSchema } from '@features/onboarding/schemas'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import {
  StepperList,
  type StepperListPrimitives,
} from '@shared/components/ui/stepper'
import { useMemo, useState } from 'react'

export function OnboardingPage(): ReactElement {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const isProfileValid = useMemo(
    () =>
      profileStepNavigationSchema.safeParse({ firstName, lastName }).success,
    [firstName, lastName],
  )

  return (
    <div className="flex min-h-screen items-center justify-center w-full">
      <Stepper.Root className="w-full max-w-2xl px-4">
        {({ stepper }): ReactElement => {
          const currentId = stepper.state.current.data.id

          return (
            <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
              <CardHeader className="space-y-4">
                <StepperList
                  isStepDisabled={stepId =>
                    stepId === 'workspace' &&
                    currentId === 'profile' &&
                    !isProfileValid
                  }
                  // Safe cast: Item is the only step-ID-specific primitive;
                  // StepperList only reads step.id as string at runtime.
                  primitives={Stepper as unknown as StepperListPrimitives}
                  stepper={stepper}
                />

                <div className="space-y-1.5">
                  <CardTitle className="text-2xl font-semibold tracking-tight">
                    {stepper.state.current.data.title}
                  </CardTitle>
                  <CardDescription>
                    {stepper.state.current.data.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <Stepper.Content step="profile">
                <OnboardingStepProfile
                  firstName={firstName}
                  imageUrl={imageUrl}
                  lastName={lastName}
                  onContinueSuccess={() => {
                    stepper.navigation.goTo('workspace')
                  }}
                  onFirstNameChange={setFirstName}
                  onImageUrlChange={setImageUrl}
                  onLastNameChange={setLastName}
                />
              </Stepper.Content>
              <Stepper.Content step="workspace">
                <OnboardingStepWorkspace
                  logoUrl={logoUrl}
                  name={workspaceName}
                  slug={workspaceSlug}
                  onBack={() => {
                    stepper.navigation.goTo('profile')
                  }}
                  onLogoUrlChange={setLogoUrl}
                  onNameChange={setWorkspaceName}
                  onSlugChange={setWorkspaceSlug}
                />
              </Stepper.Content>
            </Card>
          )
        }}
      </Stepper.Root>
    </div>
  )
}
