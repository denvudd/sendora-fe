import { useEffect, useState } from 'react'

export function useResponsiveSize(aspectRatio: number, preferWidth = false) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  )

  useEffect(() => {
    const updateSize = () => {
      const padding = 32
      const vh = window.innerHeight - padding
      const vw = window.innerWidth - padding

      let width: number
      let height: number

      if (preferWidth) {
        width = vw * 0.95
        height = width / aspectRatio

        if (height > vh * 0.95) {
          height = vh * 0.95
          width = height * aspectRatio
        }
      } else {
        height = vh * 0.95
        width = height * aspectRatio

        if (width > vw * 0.95) {
          width = vw * 0.95
          height = width / aspectRatio
        }
      }

      setSize({ width: Math.round(width), height: Math.round(height) })
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    return () => window.removeEventListener('resize', updateSize)
  }, [aspectRatio, preferWidth])

  return size
}
