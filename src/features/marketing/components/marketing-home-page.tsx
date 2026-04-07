import type { ReactElement } from 'react'

import { buttonVariants } from '@shared/components/ui/button'
import Link from 'next/link'

const featureHighlights = [
  'AI sales rep with custom lead qualification flows',
  'Embeddable website widget with real-time fallback chat',
  'Booking, Stripe payments, and triggered email sequences',
] as const

const pillars = [
  {
    description:
      'Guide visitors from first question to qualified lead without forcing them through disconnected tools.',
    title: 'Conversations that convert',
  },
  {
    description:
      'Keep booking, payments, and follow-up inside one operating system built for modern service teams.',
    title: 'Revenue flow in one place',
  },
  {
    description:
      'Prepare the product for agencies with customization, white-labeling, and plan-based feature controls.',
    title: 'Built to be resold',
  },
] as const

export function MarketingHomePage(): ReactElement {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden">
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top_left,rgba(24,24,27,0.12),transparent_42%),linear-gradient(135deg,rgba(244,244,245,0.96),rgba(255,255,255,1))]
          "
        />
        <div
          className="
            relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-20
            lg:px-10 lg:py-28
          "
        >
          <div className="flex flex-col gap-6">
            <span
              className="
                text-sm font-medium tracking-[0.28em] text-muted-foreground
                uppercase
              "
            >
              Sendora MVP
            </span>
            <div className="flex max-w-4xl flex-col gap-6">
              <h1
                className="
                  max-w-3xl text-5xl font-semibold tracking-tight text-balance
                  text-foreground
                  sm:text-6xl
                  lg:text-7xl
                "
              >
                Turn every customer conversation into booked revenue.
              </h1>
              <p
                className="
                  max-w-2xl text-lg/8 text-muted-foreground
                  sm:text-xl
                "
              >
                Sendora unifies AI sales chat, booking, payments, and email
                follow-up into one platform for fast-moving teams.
              </p>
            </div>
            <div
              className="
                flex flex-col gap-3 pt-2
                sm:flex-row
              "
            >
              <Link
                className={buttonVariants({
                  className: 'size-auto px-4',
                  size: 'lg',
                })}
                href="/sign-up"
              >
                Start building the MVP
              </Link>
              <Link
                className={buttonVariants({
                  className: 'size-auto px-4',
                  size: 'lg',
                  variant: 'outline',
                })}
                href="#product-pillars"
              >
                Review product pillars
              </Link>
            </div>
          </div>

          <div
            className="
              grid gap-4
              lg:grid-cols-3
            "
          >
            {featureHighlights.map(featureHighlight => (
              <div
                key={featureHighlight}
                className="
                  rounded-2xl border border-border/70 bg-background/80 p-5
                  backdrop-blur-sm
                "
              >
                <p className="text-sm/7 text-foreground">{featureHighlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-t border-border/70 bg-muted/30"
        id="product-pillars"
      >
        <div
          className="
            mx-auto grid w-full max-w-6xl gap-6 px-6 py-16
            lg:grid-cols-3 lg:px-10
          "
        >
          {pillars.map(pillar => (
            <article
              key={pillar.title}
              className="
                flex flex-col gap-4 rounded-3xl border border-border/70 bg-card
                p-8 shadow-sm
              "
            >
              <p
                className="
                  text-sm font-medium tracking-[0.24em] text-muted-foreground
                  uppercase
                "
              >
                Pillar
              </p>
              <h2
                className="
                  text-2xl font-semibold tracking-tight text-foreground
                "
              >
                {pillar.title}
              </h2>
              <p className="text-base/7 text-muted-foreground">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
