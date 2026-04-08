import type { ReactElement } from 'react'

import { OnboardingPage } from '@features/onboarding/components/onboarding-page'

const Onboarding = (): ReactElement => (
  <main className="flex min-h-screen items-center justify-center bg-background">
    <OnboardingPage />
  </main>
)

export default Onboarding
