import type { ReactElement } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@shared/components/ui/accordion'

import { FadeIn } from './fade-in'

const faqs = [
  {
    question: 'How does the AI chatbot work?',
    answer:
      "Sendora's AI chatbot is powered by OpenAI and uses your custom sales flows to have natural, context-aware conversations with visitors. It qualifies leads, answers questions, and can seamlessly hand off to a human agent when needed.",
  },
  {
    question: 'How do I add Sendora to my website?',
    answer:
      "Simply copy a single iframe snippet from your dashboard and paste it into your website's HTML. No coding experience required — it works on any platform including WordPress, Shopify, Webflow, and custom sites.",
  },
  {
    question: 'Can I accept payments through the chatbot?',
    answer:
      'Yes! Sendora integrates with Stripe so your visitors can complete payments directly within the chat. You can also schedule appointments with the built-in calendar widget.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Absolutely. Every plan comes with a free 14-day trial — no credit card required. You can explore all features and upgrade or cancel anytime.',
  },
  {
    question: 'Can I white-label Sendora for my clients?',
    answer:
      'Yes, the Pro plan includes full white-label capabilities. You can customize colors, branding, and domain to offer Sendora as your own product to clients.',
  },
  {
    question: "What happens when the AI can't answer a question?",
    answer:
      'Sendora supports real-time human fallback via live chat. When the AI detects a complex query, it can instantly transfer the conversation to your team so no lead is ever lost.',
  },
]

export function HomeFAQ(): ReactElement {
  return (
    <section className="py-24 lg:py-32 bg-background" id="faq">
      <div className="container max-w-6xl mx-auto px-4">
        <FadeIn className="text-center max-w-[580px] mx-auto mb-16">
          <span className="inline-block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary mb-3">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-[1.18]">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Everything you need to know about Sendora.
          </p>
        </FadeIn>

        <FadeIn className="max-w-[660px] mx-auto">
          <Accordion className="space-y-2.5">
            {faqs.map((faq, i) => (
              <AccordionItem
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="rounded-2xl border border-border bg-card px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-md transition-all duration-200"
                value={`item-${i}`}
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5 text-[0.9375rem]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-[1.75] pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  )
}
