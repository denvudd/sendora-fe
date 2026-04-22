import type { ReactElement } from 'react'

import { currentUser } from '@clerk/nextjs/server'
import { OnboardingPage } from '@features/onboarding/components/onboarding-page'
import { redirect } from 'next/navigation'

import { listActivePlans } from '@/features/commercial/repositories/plan-repository'

export const dynamic = 'force-dynamic'

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
