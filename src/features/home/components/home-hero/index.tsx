import type { ReactElement } from 'react'

import { Button, buttonVariants } from '@shared/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import Link from 'next/link'

import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

import { HomeSafariMockupPreview } from './home-safari-mockup-preview'

export function HomeHero({
  isSignedIn,
}: {
  isSignedIn: boolean
}): ReactElement {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 bg-background overflow-hidden">
      <div
        className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top_left,var(--color-secondary),transparent_70%),radial-gradient(circle_at_bottom_right,var(--color-muted),transparent_40%)]
          "
      />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border text-sm font-medium mb-6 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AI-Powered Sales Automation
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            Turn Every Conversation Into a{' '}
            <span className="bg-linear-to-r from-primary to-primary/40 bg-clip-text text-transparent">
              Conversion
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            Sendora unifies AI chatbots with automated email marketing to help
            you capture, engage, and convert leads in real time — all from one
            platform.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Link
              className={cn(
                buttonVariants({
                  size: 'lg',
                }),
                'text-base px-8 py-6',
              )}
              href={isSignedIn ? ROUTES.Dashboard : ROUTES.SignUp}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Button className="text-base px-8 py-6" size="lg" variant="outline">
              <Play className="w-4 h-4 mr-1" />
              Watch Demo
            </Button>
          </div>

          <p
            className="text-xs text-muted-foreground mt-4 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            No credit card required · Cancel anytime
          </p>
        </div>

        <HomeSafariMockupPreview />
      </div>
    </section>
  )
}
