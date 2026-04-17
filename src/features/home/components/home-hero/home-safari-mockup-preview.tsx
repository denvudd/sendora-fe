'use client'

import { SafariMockup } from '@/shared/components/ui/device-mockups/safari-mockup'
import { useResponsiveSize } from '@/shared/hooks/use-responsive-size'

export function HomeSafariMockupPreview() {
  const size = useResponsiveSize(940 / 587, false)

  if (!size) {
    return <div className="bg-muted/50 animate-pulse" />
  }

  return (
    <div className="flex items-center justify-center">
      <SafariMockup
        height={size.height}
        imageSrc="/images/app-ui.png"
        mode="simple"
        url="sendora.io"
        width={size.width}
      />
    </div>
  )
}
