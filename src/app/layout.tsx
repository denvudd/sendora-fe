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
  metadataBase: new URL('https://www.sendora.forum'),
  title: {
    default: 'Sendora',
    template: '%s | Sendora',
  },
  description: 'AI-powered conversational sales and email marketing platform.',
  openGraph: {
    type: 'website',
    siteName: 'Sendora',
    title: 'Sendora',
    description:
      'AI-powered conversational sales and email marketing platform.',
    url: 'https://www.sendora.forum',
    images: [
      {
        url: '/images/app-ui.png',
        width: 1200,
        height: 630,
        alt: 'Sendora — AI-powered sales platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sendora',
    description:
      'AI-powered conversational sales and email marketing platform.',
    images: ['/images/app-ui.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
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
