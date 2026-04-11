import type { ReactElement } from 'react'

import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Marketing Director',
    company: 'GrowthLab',
    quote:
      'Sendora replaced three tools for us. Our lead capture rate jumped 40% in the first month, and the AI chatbot handles 80% of inquiries without any human intervention.',
    rating: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Founder & CEO',
    company: 'BookRight Consulting',
    quote:
      'The booking and payment integration is seamless. We went from missing 60% of leads to converting them automatically while we sleep. Game changer for our consulting business.',
    rating: 5,
  },
  {
    name: 'Emma Johansson',
    role: 'Agency Owner',
    company: 'Pixel & Flow',
    quote:
      "White-labeling Sendora for our clients was effortless. We now offer AI chat as a premium service and it's become our fastest-growing revenue stream.",
    rating: 5,
  },
]

export function HomeTestimonials(): ReactElement {
  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by Businesses Worldwide
          </h2>
          <p className="text-muted-foreground text-lg">
            See how teams are growing revenue with Sendora.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map(t => (
            <div
              key={t.name}
              className="rounded-2xl bg-card border border-border/50 shadow-card p-8 hover:shadow-glow hover:border-primary/20 transition-all duration-300 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="w-4 h-4 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>

              <blockquote className="text-foreground leading-relaxed mb-6 flex-1">
                &quot;{t.quote}&quot;
              </blockquote>

              <div>
                <p className="font-semibold text-foreground text-sm">
                  {t.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.role}, {t.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
