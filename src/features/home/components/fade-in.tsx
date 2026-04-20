'use client'

import type { ReactNode } from 'react'

import { useEffect, useRef } from 'react'

import { cn } from '@/shared/utils/cn'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  threshold?: number
}

export function FadeIn({
  children,
  className,
  delay = 0,
  threshold = 0.1,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current

    if (!el) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin: '0px 0px -32px 0px' },
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: 0,
        transform: 'translateY(20px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
