import type { ReactElement } from 'react'

import { Code2, MessageCircle, TrendingUp } from 'lucide-react'

const steps = [
  {
    icon: Code2,
    step: '01',
    title: 'Embed in Seconds',
    description:
      'Copy a single iframe snippet and paste it into your website. No coding skills needed.',
  },
  {
    icon: MessageCircle,
    step: '02',
    title: 'AI Engages Visitors',
    description:
      'Your AI sales rep qualifies leads, answers questions, books appointments, and takes payments 24/7.',
  },
  {
    icon: TrendingUp,
    step: '03',
    title: 'Convert & Grow',
    description:
      'Captured leads are automatically nurtured with email campaigns while you track revenue in real time.',
  },
]

export function HomeHowItWorks(): ReactElement {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30" id="how-it-works">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Three Steps to Automated Sales
          </h2>
          <p className="text-muted-foreground text-lg">
            Get your AI sales agent live in minutes, not months.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.step} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px border-t-2 border-dashed border-primary/20" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-soft">
                <step.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Step {step.step}
              </span>
              <h3 className="text-xl font-bold text-foreground mt-2 mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
