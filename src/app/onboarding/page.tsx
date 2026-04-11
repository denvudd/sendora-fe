import type { ReactElement } from 'react'

import { currentUser } from '@clerk/nextjs/server'
import { listActivePlans } from '@features/home/repositories/plan-repository'
import { OnboardingPage } from '@features/onboarding/components/onboarding-page'
import { redirect } from 'next/navigation'

const Onboarding = async (): Promise<ReactElement> => {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/sign-in')
  }

  const plans = await listActivePlans()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <OnboardingPage
        clerkFirstName={clerkUser.firstName}
        clerkLastName={clerkUser.lastName}
        plans={plans}
      />
    </main>
  )
}

export default Onboarding
