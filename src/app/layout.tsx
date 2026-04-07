import type { Metadata } from 'next'
import type { ReactElement, ReactNode } from 'react'

import { Geist, Geist_Mono } from 'next/font/google'

import '@/env'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  description: 'AI-powered conversational sales and email marketing platform.',
  title: 'Sendora',
}

const RootLayout = ({ children }: { children: ReactNode }): ReactElement => (
  <html
    className={[geistSans.variable, geistMono.variable, 'h-full antialiased']
      .filter(Boolean)
      .join(' ')}
    lang="en"
  >
    <body className="flex min-h-full flex-col">{children}</body>
  </html>
)

export default RootLayout
