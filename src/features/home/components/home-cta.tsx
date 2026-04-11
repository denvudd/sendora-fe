import type { ReactElement } from 'react'

import { Button } from '@shared/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function HomeCTA(): ReactElement {
  return (
    <section className="py-20 lg:py-28 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 text-center relative">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          Ready to Automate Your Sales?
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Join hundreds of businesses using Sendora to turn conversations into
          customers. Start your free trial today.
        </p>
        <Button className="text-base px-10 py-6" size="lg">
          Start Free Trial
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </section>
  )
}
