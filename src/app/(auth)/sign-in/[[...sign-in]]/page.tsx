import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { SignIn } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
}

const SignInPage = (): ReactElement => <SignIn />

export default SignInPage
