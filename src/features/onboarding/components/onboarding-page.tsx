'use client'

import type { PlanWithFeatures } from '@shared/types/plan'
import type { ReactElement } from 'react'

import { OnboardingStepPlan } from '@features/onboarding/components/onboarding-step-plan'
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

interface OnboardingPageProps {
  clerkFirstName: string | null
  clerkLastName: string | null
  plans: PlanWithFeatures[]
}

export function OnboardingPage({
  clerkFirstName,
  clerkLastName,
  plans,
}: OnboardingPageProps): ReactElement {
  const [firstName, setFirstName] = useState(clerkFirstName ?? '')
  const [lastName, setLastName] = useState(clerkLastName ?? '')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

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
                  isStepDisabled={stepId => {
                    if (
                      stepId === 'workspace' &&
                      currentId === 'profile' &&
                      !isProfileValid
                    ) {
                      return true
                    }

                    if (stepId === 'plan' && currentId !== 'plan') {
                      return true
                    }

                    return false
                  }}
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
                  lastName={lastName}
                  onContinueSuccess={() => {
                    stepper.navigation.goTo('workspace')
                  }}
                  onFirstNameChange={setFirstName}
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
                  onSuccess={id => {
                    setWorkspaceId(id)
                    stepper.navigation.goTo('plan')
                  }}
                />
              </Stepper.Content>

              <Stepper.Content step="plan">
                {workspaceId && (
                  <OnboardingStepPlan plans={plans} workspaceId={workspaceId} />
                )}
              </Stepper.Content>
            </Card>
          )
        }}
      </Stepper.Root>
    </div>
  )
}
