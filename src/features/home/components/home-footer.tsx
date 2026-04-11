import type { ReactElement } from 'react'

import { Image } from '@/shared/components/ui/image'

export function HomeFooter(): ReactElement {
  return (
    <footer className="bg-card border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Image
            alt="Sendora"
            height={100}
            src="/images/logo.png"
            width={100}
          />

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
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

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sendora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
