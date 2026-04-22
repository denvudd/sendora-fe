import type { ReactElement } from 'react'

import { Image } from '@/shared/components/ui/image'

const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Changelog', href: '#' },
]

const COMPANY_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Careers', href: '#' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
]

export function HomeFooter(): ReactElement {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 border-b border-border mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                alt="Sendora"
                height={28}
                src="/images/logo.png"
                width={100}
              />
            </div>
            <p className="text-sm text-muted-foreground leading-[1.7] max-w-[240px]">
              AI-powered sales automation that turns every conversation into a
              conversion.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-foreground mb-4">
              Product
            </h4>
            <ul className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map(l => (
                <li key={l.label}>
                  <a
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    href={l.href}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-foreground mb-4">
              Company
            </h4>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map(l => (
                <li key={l.label}>
                  <a
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    href={l.href}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-foreground mb-4">
              Legal
            </h4>
            <ul className="flex flex-col gap-2.5">
              {LEGAL_LINKS.map(l => (
                <li key={l.label}>
                  <a
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    href={l.href}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[0.78rem] text-muted-foreground">
          <p>© {new Date().getFullYear()} Sendora. All rights reserved.</p>
          <div className="flex gap-5">
            <a className="hover:text-foreground transition-colors" href="#">
              Privacy
            </a>
            <a className="hover:text-foreground transition-colors" href="#">
              Terms
            </a>
            <a className="hover:text-foreground transition-colors" href="#">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
