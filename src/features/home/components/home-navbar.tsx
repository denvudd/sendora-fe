'use client'

import type { ReactElement } from 'react'

import { buttonVariants } from '@shared/components/ui/button'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { Image } from '@/shared/components/ui/image'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

const NAVBAR_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
]

export function HomeNavbar({
  isSignedIn,
}: {
  isSignedIn: boolean
}): ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })

    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/88 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link className="flex items-center gap-2.5 no-underline" href="/">
          <Image alt="Sendora" height={28} src="/images/logo.png" width={100} />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-7 list-none">
          {NAVBAR_LINKS.map(link => (
            <li key={link.href}>
              <a
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                href={link.href}
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            className={buttonVariants({ size: 'sm', variant: 'ghost' })}
            href={isSignedIn ? ROUTES.Dashboard : ROUTES.SignIn}
          >
            Log in
          </Link>
          <Link
            className={buttonVariants({ size: 'sm' })}
            href={isSignedIn ? ROUTES.Dashboard : ROUTES.SignUp}
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label="Toggle menu"
          className="md:hidden text-foreground p-1"
          type="button"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          {NAVBAR_LINKS.map(link => (
            <a
              key={link.href}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              href={link.href}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <Link
              className={buttonVariants({ size: 'sm', variant: 'ghost' })}
              href={isSignedIn ? ROUTES.Dashboard : ROUTES.SignIn}
            >
              Log in
            </Link>
            <Link
              className={buttonVariants({ size: 'sm' })}
              href={isSignedIn ? ROUTES.Dashboard : ROUTES.SignUp}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
