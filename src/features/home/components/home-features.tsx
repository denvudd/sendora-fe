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

const features = [
  {
    Icon: Bot,
    title: 'AI Sales Representative',
    description:
      '24/7 automated chatbot powered by OpenAI with smart conversational flows and real-time human fallback.',
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
      'Create campaigns triggered by chat interactions. Automated sequences that nurture leads to conversion.',
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
      'OTP verification, social login, and secure file uploads to keep your data protected.',
  },
]

export function HomeFeatures(): ReactElement {
  return (
    <section className="py-20 lg:py-28 bg-background" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Sell Smarter
          </h2>
          <p className="text-muted-foreground text-lg">
            One platform to automate conversations, capture leads, book
            meetings, and grow revenue.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-card border border-border/50 shadow-card hover:shadow-glow hover:border-primary/20 transition-all duration-300"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                <feature.Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
