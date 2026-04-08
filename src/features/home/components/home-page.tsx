import type { ReactElement } from 'react'

import { listActivePlans } from '@features/home/repositories/plan-repository'
import { Badge } from '@shared/components/ui/badge'
import { buttonVariants } from '@shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card'
import Link from 'next/link'

const heroStats = [
  { label: 'Conversations automated', value: '10k+' },
  { label: 'Lead capture uplift', value: '30%+' },
  { label: 'Setup time', value: '< 15 min' },
] as const

const problems = [
  'Leads wait hours for a response and lose intent.',
  'Booking, payments, and follow-ups are split across tools.',
  'Sales and marketing data is fragmented and hard to act on.',
] as const

const valueProps = [
  {
    description:
      'Deploy an AI sales rep that qualifies visitors and escalates hot opportunities in real time.',
    title: 'Conversational selling',
  },
  {
    description:
      'Turn chat outcomes into meetings using built-in scheduling and availability controls.',
    title: 'Booking automation',
  },
  {
    description:
      'Collect secure in-chat payments and move prospects forward without leaving the flow.',
    title: 'Payments in context',
  },
  {
    description:
      'Launch triggered sequences and campaigns based on visitor behavior and lead stage.',
    title: 'Email follow-up engine',
  },
  {
    description:
      'Customize branding, colors, and messaging for each workspace or client environment.',
    title: 'White-label control',
  },
  {
    description:
      'Use subscription tiers and feature toggles to scale monetization with clear product limits.',
    title: 'Plan-based growth',
  },
] as const

const steps = [
  {
    description:
      'Configure your assistant tone, qualifying questions, and conversion goals.',
    title: '1. Launch your AI rep',
  },
  {
    description:
      'Embed one snippet on your site and start engaging every visitor automatically.',
    title: '2. Capture and convert',
  },
  {
    description:
      'Track leads, bookings, payments, and campaign performance in one dashboard.',
    title: '3. Optimize revenue',
  },
] as const

const testimonials = [
  {
    name: 'Marta H.',
    quote:
      'Sendora replaced three tools for us. We started booking qualified calls in week one.',
    role: 'Growth Lead, AgencyFlow',
  },
  {
    name: 'Dr. Levin',
    quote:
      'Our clinic now handles inquiries 24/7. Conversion speed improved dramatically.',
    role: 'Founder, ClinicSync',
  },
  {
    name: 'Roman K.',
    quote:
      'The pricing controls and white-label options made it easy to package for clients.',
    role: 'Owner, GrowthOps',
  },
] as const

const faqItems = [
  {
    answer:
      'Yes. Active pricing plans are loaded server-side from your `Plan` and `PlanFeature` tables.',
    question: 'Does pricing come from the database?',
  },
  {
    answer:
      'Yes. Sendora provides an embeddable widget and workflow setup without complex integration.',
    question: 'Can I install this on any website?',
  },
  {
    answer:
      'Yes. You can control branding, feature limits, and plan access for each workspace.',
    question: 'Is it suitable for agencies and resellers?',
  },
] as const

function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(priceInCents / 100)
}

export async function HomePage(): Promise<ReactElement> {
  const plans = await listActivePlans()

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b">
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.09),transparent_42%)]
          "
        />
        <div
          className="
            relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20
            lg:px-10 lg:py-24
          "
        >
          <Badge className="w-fit" variant="secondary">
            AI sales platform for modern teams
          </Badge>
          <div className="space-y-4">
            <h1
              className="
                max-w-5xl text-4xl font-semibold tracking-tight
                sm:text-6xl
              "
            >
              Turn website traffic into qualified revenue with one marketing
              engine.
            </h1>
            <p
              className="
                max-w-3xl text-lg text-muted-foreground
                sm:text-xl
              "
            >
              Sendora combines AI chat, lead capture, booking, payments, and
              email automation into a single conversion system.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={buttonVariants({
                className: 'size-auto px-5',
                size: 'lg',
              })}
              href="/sign-up"
            >
              Start free
            </Link>
            <Link
              className={buttonVariants({
                className: 'size-auto px-5',
                size: 'lg',
                variant: 'outline',
              })}
              href="#how-it-works"
            >
              See how it works
            </Link>
          </div>
          <div
            className="
              grid gap-4
              sm:grid-cols-3
            "
          >
            {heroStats.map(stat => (
              <Card key={stat.label} className="bg-background/80">
                <CardContent className="space-y-1 pt-6">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="
          mx-auto w-full max-w-6xl px-6 py-16
          lg:px-10
        "
      >
        <div className="mb-8 space-y-3">
          <Badge variant="outline">Why teams switch</Badge>
          <h2
            className="
              text-3xl font-semibold tracking-tight
              sm:text-4xl
            "
          >
            Most revenue leaks happen before your team replies.
          </h2>
        </div>
        <div
          className="
            grid gap-4
            lg:grid-cols-3
          "
        >
          {problems.map(problem => (
            <Card key={problem}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{problem}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/20">
        <div
          className="
            mx-auto w-full max-w-6xl px-6 py-16
            lg:px-10
          "
        >
          <div className="mb-8 space-y-3">
            <Badge variant="outline">Product capabilities</Badge>
            <h2
              className="
                text-3xl font-semibold tracking-tight
                sm:text-4xl
              "
            >
              Everything needed to move a lead from first message to closed
              deal.
            </h2>
          </div>
          <div
            className="
              grid gap-5
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {valueProps.map(valueProp => (
              <Card key={valueProp.title}>
                <CardHeader>
                  <CardTitle>{valueProp.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{valueProp.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="
          mx-auto w-full max-w-6xl px-6 py-16
          lg:px-10
        "
        id="how-it-works"
      >
        <div className="mb-8 space-y-3">
          <Badge variant="outline">How it works</Badge>
          <h2
            className="
              text-3xl font-semibold tracking-tight
              sm:text-4xl
            "
          >
            Launch quickly, convert continuously.
          </h2>
        </div>
        <div
          className="
            grid gap-5
            lg:grid-cols-3
          "
        >
          {steps.map(step => (
            <Card key={step.title}>
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30" id="pricing">
        <div
          className="
            mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16
            lg:px-10
          "
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Pricing</h2>
            <p className="text-muted-foreground">
              Sendora is a subscription-based platform. Select a plan that fits
              your needs and get started.
            </p>
          </div>

          {plans.length > 0 ? (
            <div
              className="
                grid gap-6
                lg:grid-cols-3
              "
            >
              {plans.map(plan => (
                <Card key={plan.id} className="relative overflow-hidden">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.description ?? 'Flexible plan for your team.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent
                    className="
                    flex flex-1 flex-col justify-between gap-4
                  "
                  >
                    <div className="h-full flex-1 space-y-4">
                      <div className="text-3xl font-semibold">
                        {formatPrice(plan.monthlyPriceCents)}
                        <span
                          className="
                            ml-1 text-sm font-normal text-muted-foreground
                          "
                        >
                          /month
                        </span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {plan.features
                          .filter(planFeature => planFeature.isEnabled)
                          .map(planFeature => (
                            <li
                              key={planFeature.id}
                              className="
                                flex items-center justify-between gap-3
                              "
                            >
                              <span>{planFeature.feature.name}</span>
                              <span className="text-muted-foreground">
                                {planFeature.limitValue ?? 'Unlimited'}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link
                      className={buttonVariants({
                        className: 'mt-auto w-full',
                        size: 'lg',
                      })}
                      href="/sign-up"
                    >
                      Get started
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No active plans yet</CardTitle>
                <CardDescription>
                  Seed your database to display pricing plans on this landing
                  page.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>

      <section
        className="
          mx-auto w-full max-w-6xl px-6 py-16
          lg:px-10
        "
      >
        <div className="mb-8 space-y-3">
          <Badge variant="outline">Testimonials</Badge>
          <h2
            className="
              text-3xl font-semibold tracking-tight
              sm:text-4xl
            "
          >
            Teams already using Sendora to grow faster.
          </h2>
        </div>
        <div
          className="
            grid gap-5
            lg:grid-cols-3
          "
        >
          {testimonials.map(testimonial => (
            <Card key={testimonial.name}>
              <CardContent className="space-y-4 pt-6">
                <p className="text-sm text-muted-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/20">
        <div
          className="
            mx-auto w-full max-w-6xl px-6 py-16
            lg:px-10
          "
        >
          <div className="mb-8 space-y-3">
            <Badge variant="outline">FAQ</Badge>
            <h2
              className="
                text-3xl font-semibold tracking-tight
                sm:text-4xl
              "
            >
              Answers for launch and go-to-market teams.
            </h2>
          </div>
          <div
            className="
              grid gap-4
              md:grid-cols-2
            "
          >
            {faqItems.map(item => (
              <Card key={item.question}>
                <CardHeader>
                  <CardTitle className="text-base">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.answer}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="
          mx-auto w-full max-w-6xl px-6 py-16
          lg:px-10
        "
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent
            className="
              flex flex-col gap-6 pt-8 text-center
              sm:items-center
            "
          >
            <Badge className="mx-auto w-fit" variant="secondary">
              Ready to scale
            </Badge>
            <h2
              className="
                max-w-3xl text-3xl font-semibold tracking-tight
                sm:text-4xl
              "
            >
              Stop losing revenue to slow response cycles and fragmented
              tooling.
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Launch Sendora and unify chat, booking, payments, and email in one
              conversion flow.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                className={buttonVariants({
                  className: 'size-auto px-5',
                  size: 'lg',
                })}
                href="/sign-up"
              >
                Create workspace
              </Link>
              <Link
                className={buttonVariants({
                  className: 'size-auto px-5',
                  size: 'lg',
                  variant: 'outline',
                })}
                href="#pricing"
              >
                Compare plans
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="border-t">
        <div
          className="
            mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm
            text-muted-foreground
            lg:flex-row lg:items-center lg:justify-between lg:px-10
          "
        >
          <p>
            Sendora © {new Date().getFullYear()} — AI-powered sales and email
            marketing platform.
          </p>
          <div className="flex gap-4">
            <Link className="hover:text-foreground" href="/sign-up">
              Get started
            </Link>
            <a className="hover:text-foreground" href="#pricing">
              Pricing
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
