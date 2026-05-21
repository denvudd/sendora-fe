import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Sign Up',
  robots: { index: false, follow: false },
}

const SignUpPage = (): ReactElement => <SignUp />

export default SignUpPage
