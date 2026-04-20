import type { ReactElement } from 'react'

import { Code2, MessageCircle, TrendingUp } from 'lucide-react'

import { FadeIn } from './fade-in'

const steps = [
  {
    Icon: Code2,
    step: '01',
    tag: 'Step One',
    title: 'Embed in Seconds',
    description:
      'Copy a single iframe snippet and paste it into your website. No coding skills needed.',
  },
  {
    Icon: MessageCircle,
    step: '02',
    tag: 'Step Two',
    title: 'AI Engages Visitors',
    description:
      'Your AI sales rep qualifies leads, answers questions, books appointments, and takes payments 24/7.',
  },
  {
    Icon: TrendingUp,
    step: '03',
    tag: 'Step Three',
    title: 'Convert & Grow',
    description:
      'Captured leads are automatically nurtured with email campaigns while you track revenue in real time.',
  },
]

export function HomeHowItWorks(): ReactElement {
  return (
    <section
      className="py-24 lg:py-32"
      id="how-it-works"
      style={{ background: 'oklch(0.924 0.014 93 / 0.35)' }}
    >
      <div className="container mx-auto px-4">
        <FadeIn className="text-center max-w-[580px] mx-auto mb-16">
          <span className="inline-block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary mb-3">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-[1.18]">
            Three Steps to Automated Sales
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Get your AI sales agent live in minutes, not months.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-[880px] mx-auto">
          {steps.map((step, i) => (
            <div key={step.step} className="relative text-center px-7">
              {/* Animated dashed connector line */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-9 left-[calc(50%+36px)] pointer-events-none"
                  style={{
                    width: 'calc(100% - 72px)',
                    height: '2px',
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      oklch(0.6171 0.1375 39.0427 / 0.35) 0px,
                      oklch(0.6171 0.1375 39.0427 / 0.35) 8px,
                      transparent 8px,
                      transparent 16px
                    )`,
                    backgroundSize: '16px 2px',
                    animation: 'dashFlow 1s linear infinite',
                  }}
                />
              )}

              <FadeIn delay={i * 150}>
                {/* Step number ring */}
                <div className="flex items-center justify-center mb-6">
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                    style={{
                      border: '2px solid oklch(0.6171 0.1375 39.0427 / 0.25)',
                    }}
                  >
                    <div
                      className="w-[52px] h-[52px] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-[1.1rem]"
                      style={{
                        boxShadow:
                          '0 4px 18px oklch(0.6171 0.1375 39.0427 / 0.3)',
                      }}
                    >
                      {step.step}
                    </div>
                  </div>
                </div>

                <span className="inline-block text-[0.7rem] font-bold uppercase tracking-[0.08em] text-primary mb-2">
                  {step.tag}
                </span>
                <h3 className="text-[1.1rem] font-bold text-foreground mb-2.5">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </FadeIn>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes dashFlow { from { background-position: 0 0; } to { background-position: 16px 0; } }
      `}</style>
    </section>
  )
}
