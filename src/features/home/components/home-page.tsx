import type { ReactElement } from 'react'

import { currentUser } from '@clerk/nextjs/server'
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
  const user = await currentUser()
  const isSignedIn = !!user

  return (
    <div className="min-h-screen bg-background">
      <HomeNavbar isSignedIn={isSignedIn} />
      <HomeHero isSignedIn={isSignedIn} />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomeTestimonials />
      <HomePricingPlans isSignedIn={isSignedIn} plans={plans} />
      <HomeFAQ />
      <HomeCTA isSignedIn={isSignedIn} />
      <HomeFooter />
    </div>
  )
}
