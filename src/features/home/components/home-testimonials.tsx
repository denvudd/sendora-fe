import type { ReactElement } from 'react'

import { Star } from 'lucide-react'

import { FadeIn } from './fade-in'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Marketing Director',
    company: 'GrowthLab',
    initials: 'SC',
    quote:
      'Sendora replaced three tools for us. Our lead capture rate jumped 40% in the first month, and the AI chatbot handles 80% of inquiries without any human intervention.',
    rating: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Founder & CEO',
    company: 'BookRight Consulting',
    initials: 'MR',
    quote:
      'The booking and payment integration is seamless. We went from missing 60% of leads to converting them automatically while we sleep. Game changer for our consulting business.',
    rating: 5,
  },
  {
    name: 'Emma Johansson',
    role: 'Agency Owner',
    company: 'Pixel & Flow',
    initials: 'EJ',
    quote:
      "White-labeling Sendora for our clients was effortless. We now offer AI chat as a premium service and it's become our fastest-growing revenue stream.",
    rating: 5,
  },
]

export function HomeTestimonials(): ReactElement {
  return (
    <section className="py-24 lg:py-32 bg-background" id="testimonials">
      <div className="container max-w-6xl mx-auto px-4">
        <FadeIn className="text-center max-w-[580px] mx-auto mb-16">
          <span className="inline-block text-[0.72rem] font-bold uppercase tracking-widest text-primary mb-3">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-[1.18]">
            Loved by Businesses Worldwide
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            See how teams are growing revenue with Sendora.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <FadeIn
              key={t.name}
              className="flex flex-col gap-4 rounded-2xl bg-card border border-border p-7 transform transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
              delay={i * 120}
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-[0.88rem] text-foreground leading-[1.75] flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[0.8rem] shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-[0.875rem] text-foreground leading-tight">
                    {t.name}
                  </p>
                  <p className="text-[0.75rem] text-muted-foreground">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
