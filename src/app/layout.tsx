import type { Metadata } from 'next'
import type { ReactElement, ReactNode } from 'react'

import { ClerkProvider } from '@clerk/nextjs'
import { Geist_Mono, Outfit } from 'next/font/google'

import '@/env'

import './globals.css'

const fontSans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  description: 'AI-powered conversational sales and email marketing platform.',
  title: 'Sendora',
}

const RootLayout = ({ children }: { children: ReactNode }): ReactElement => (
  <ClerkProvider
    appearance={{
      options: {
        unsafe_disableDevelopmentModeWarnings: true,
      },
    }}
  >
    <html
      className={[
        fontSans.variable,
        fontMono.variable,
        'h-full antialiased w-full',
      ]
        .filter(Boolean)
        .join(' ')}
      lang="en"
    >
      <body className="flex min-h-full flex-col w-full">{children}</body>
    </html>
  </ClerkProvider>
)

export default RootLayout
