'use client'

import type { ReactElement } from 'react'

import { Button } from '@shared/components/ui/button'
import { MessageSquare, Menu, X } from 'lucide-react'
import { useState } from 'react'

import { Image } from '@/shared/components/ui/image'

export function HomeNavbar(): ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = ['Features', 'How It Works', 'Pricing']

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <Image
            alt="Sendora"
            height={100}
            src="/images/logo.png"
            width={100}
          />
        </div>

        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <a
              key={link}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" variant="ghost">
            Log in
          </Button>
          <Button size="sm">Get Started Free</Button>
        </div>

        <button
          className="md:hidden text-foreground"
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          {links.map(link => (
            <a
              key={link}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setMobileOpen(false)}
            >
              {link}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Button size="sm" variant="ghost">
              Log in
            </Button>
            <Button size="sm">Get Started Free</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
