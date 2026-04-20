import type { ReactElement } from 'react'

import { buttonVariants } from '@shared/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

import { FadeIn } from './fade-in'

export function HomeCTA({ isSignedIn }: { isSignedIn: boolean }): ReactElement {
  return (
    <section
      className="relative py-24 lg:py-32 overflow-hidden text-center"
      style={{ background: 'oklch(0.1908 0.002 106.5859)' }}
    >
      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'oklch(0.6171 0.1375 39.0427 / 0.1)' }}
      />

      <div className="container max-w-6xl mx-auto px-4 relative">
        <FadeIn>
          <span
            className="inline-block text-[0.72rem] font-bold uppercase tracking-[0.1em] mb-4"
            style={{ color: 'oklch(0.6724 0.1308 38.7559)' }}
          >
            Get Started Today
          </span>
          <h2
            className="text-[clamp(2.1rem,4.5vw,3.2rem)] font-black tracking-[-0.03em] leading-[1.08] mb-4"
            style={{ color: '#fff' }}
          >
            Ready to Automate
            <br />
            Your Sales?
          </h2>
          <p
            className="text-[1.05rem] max-w-[460px] mx-auto mb-8 leading-[1.7]"
            style={{ color: 'oklch(1 0 0 / 0.65)' }}
          >
            Join hundreds of businesses using Sendora to turn conversations into
            customers. Start your free trial today.
          </p>

          <Link
            className={cn(
              buttonVariants({ size: 'lg' }),
              'text-base px-8 py-6',
            )}
            href={isSignedIn ? ROUTES.Billing : ROUTES.SignUp}
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <span
            className="block text-[0.75rem] mt-4"
            style={{ color: 'oklch(1 0 0 / 0.4)' }}
          >
            No credit card required · 14-day free trial · Cancel anytime
          </span>
        </FadeIn>
      </div>
    </section>
  )
}
