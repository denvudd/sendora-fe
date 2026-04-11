import type { ReactElement } from 'react'

import { HomePricingPlans } from '@features/home/components/home-pricing-plans'
import { listActivePlans } from '@features/home/repositories/plan-repository'

import { HomeCTA } from './home-cta'
import { HomeFAQ } from './home-faq'
import { HomeFeatures } from './home-features'
import { HomeFooter } from './home-footer'
import { HomeHero } from './home-hero'
import { HomeHowItWorks } from './home-how-it-works'
import { HomeNavbar } from './home-navbar'
import { HomeTestimonials } from './home-testimonials'

export async function HomePage(): Promise<ReactElement> {
  const plans = await listActivePlans()

  return (
    <div className="min-h-screen bg-background">
      <HomeNavbar />
      <HomeHero />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomeTestimonials />
      <HomePricingPlans plans={plans} />
      <HomeFAQ />
      <HomeCTA />
      <HomeFooter />
    </div>
  )
}
