import type { ReactElement } from 'react'

import {
  Bot,
  Globe,
  CalendarDays,
  Mail,
  Users,
  BarChart3,
  Palette,
  Shield,
} from 'lucide-react'

import { FadeIn } from './fade-in'

const features = [
  {
    Icon: Bot,
    title: 'AI Sales Representative',
    description:
      '24/7 automated chatbot powered by OpenAI with smart conversational flows and real-time human fallback. Never miss a lead again.',
    large: true,
  },
  {
    Icon: Globe,
    title: 'Universal Website Integration',
    description:
      'Embed on any website with a single iframe snippet. No complex setup — copy, paste, go live.',
  },
  {
    Icon: CalendarDays,
    title: 'Booking & Payments',
    description:
      'Built-in calendar scheduling and Stripe-powered in-chat payments with automated confirmations.',
  },
  {
    Icon: Mail,
    title: 'Email Marketing',
    description:
      'Create campaigns triggered by chat interactions. Automated sequences that nurture leads all the way to conversion.',
    large: true,
  },
  {
    Icon: Users,
    title: 'Lead Management',
    description:
      'Auto-capture visitor data, track engagement history, and manage contacts in a searchable database.',
  },
  {
    Icon: BarChart3,
    title: 'Financial Dashboard',
    description:
      'Real-time revenue overview, transaction history, and Stripe-connected earnings tracking.',
  },
  {
    Icon: Palette,
    title: 'White-Label & Branding',
    description:
      'Fully customizable interface with colors, branding, and white-label options for agencies.',
  },
  {
    Icon: Shield,
    title: 'Secure Authentication',
    description:
      'OTP verification, social login, and secure file uploads to keep your data protected at every step.',
    wide: true,
  },
]

export function HomeFeatures(): ReactElement {
  // split into rows for the bento layout
  const row1 = features.slice(0, 2) // Bot (large) + Globe
  const row2 = features.slice(2, 4) // Calendar + Email (large)
  const row3 = features.slice(4, 7) // Users + BarChart + Palette
  const row4 = features.slice(7, 8) // Shield (full width)

  return (
    <section className="py-24 lg:py-32 bg-background" id="features">
      <div className="container max-w-6xl mx-auto px-4">
        <FadeIn className="text-center max-w-[580px] mx-auto mb-16">
          <span className="inline-block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary mb-3">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-[1.18]">
            Everything You Need to Sell Smarter
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            One platform to automate conversations, capture leads, book
            meetings, and grow revenue.
          </p>
        </FadeIn>

        <div className="grid grid-cols-3 gap-3.5">
          {/* Row 1: large + normal */}
          {row1.map((f, i) => (
            <FadeIn
              key={f.title}
              className={[
                'group relative overflow-hidden rounded-2xl bg-card border border-border p-7',
                'hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-250',
                f.large ? 'col-span-2' : '',
              ].join(' ')}
              delay={i * 100}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                <f.Icon className="w-5 h-5" />
              </div>
              <h3 className="text-[0.9375rem] font-bold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-[0.855rem] text-muted-foreground leading-relaxed">
                {f.description}
              </p>
              {f.large && (
                <div className="absolute -right-7 -bottom-7 w-28 h-28 rounded-full bg-primary/8 group-hover:bg-primary/15 transition-colors pointer-events-none" />
              )}
            </FadeIn>
          ))}

          {/* Row 2: normal + large */}
          {row2.map((f, i) => (
            <FadeIn
              key={f.title}
              className={[
                'group relative overflow-hidden rounded-2xl bg-card border border-border p-7',
                'hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-250',
                f.large ? 'col-span-2' : '',
              ].join(' ')}
              delay={i * 100}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                <f.Icon className="w-5 h-5" />
              </div>
              <h3 className="text-[0.9375rem] font-bold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-[0.855rem] text-muted-foreground leading-relaxed">
                {f.description}
              </p>
              {f.large && (
                <div className="absolute -right-7 -bottom-7 w-28 h-28 rounded-full bg-primary/8 group-hover:bg-primary/15 transition-colors pointer-events-none" />
              )}
            </FadeIn>
          ))}

          {/* Row 3: 3 equal */}
          {row3.map((f, i) => (
            <FadeIn
              key={f.title}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border p-7 hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-250"
              delay={i * 100}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                <f.Icon className="w-5 h-5" />
              </div>
              <h3 className="text-[0.9375rem] font-bold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-[0.855rem] text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </FadeIn>
          ))}

          {/* Row 4: full width */}
          {row4.map(f => (
            <FadeIn
              key={f.title}
              className="group col-span-3 flex items-center gap-5 rounded-2xl bg-card border border-border px-7 py-5 hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-250"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                <f.Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[0.9375rem] font-bold text-foreground mb-1">
                  {f.title}
                </h3>
                <p className="text-[0.855rem] text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
