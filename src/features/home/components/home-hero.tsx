'use client'

import type { ReactElement } from 'react'

import { buttonVariants } from '@shared/components/ui/button'
import { ArrowRight, CalendarDays, Play, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

function ChatMockup() {
  const typing2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t2 = setTimeout(() => {
      if (typing2Ref.current) {
        typing2Ref.current.style.display = 'none'
      }
    }, 1200)

    return () => {
      clearTimeout(t2)
    }
  }, [])

  return (
    <div
      className="max-w-[360px] ml-auto rounded-2xl border border-border overflow-hidden shadow-xl"
      style={{ animation: 'floatY 5s ease-in-out infinite' }}
    >
      {/* Header */}
      <div className="bg-primary px-4 py-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 font-black text-sm text-primary">
          S
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">
            Sendora AI
          </p>
          <p className="text-[0.7rem] text-white/70">
            Sales Assistant · Online
          </p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-green-400 shadow-[0_0_0_2.5px_rgba(255,255,255,0.3)]" />
      </div>

      {/* Messages */}
      <div className="bg-background px-4 py-4 flex flex-col gap-2.5 h-[328px]">
        {/* Bot message 1 */}
        <div
          className="self-start max-w-[82%] bg-card border border-border rounded-[14px] rounded-bl-[4px] px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-foreground"
          style={{ animation: 'fadeUp .35s .2s both' }}
        >
          👋 Hi there! I&apos;m here to help. Are you looking for pricing info,
          a demo, or something else?
        </div>

        {/* User message */}
        <div
          className="self-end max-w-[82%] bg-primary text-white rounded-[14px] rounded-br-[4px] px-3.5 py-2.5 text-[0.82rem] leading-relaxed"
          style={{ opacity: 0, animation: 'fadeUp .35s 1.6s both' }}
        >
          I&apos;d love to see a demo!
        </div>

        {/* Typing before bot reply */}
        <div
          ref={typing2Ref}
          className="self-start flex gap-1 items-center bg-card border border-border rounded-[14px] rounded-bl-[4px] px-3.5 py-3"
          style={{ opacity: 0, animation: 'fadeUp .25s 2.2s both' }}
        >
          {[0, 200, 400].map(d => (
            <span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>

        {/* Bot message 2 */}
        <div
          className="self-start max-w-[82%] bg-card border border-border rounded-[14px] rounded-bl-[4px] px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-foreground"
          style={{ opacity: 0, animation: 'fadeUp .35s 3.2s both' }}
        >
          Great choice! I&apos;ll grab a few details to personalize it for you.
          <br />
          <br />
          What&apos;s your name and company?
        </div>

        {/* Final typing indicator */}
        <div
          className="self-start flex gap-1 items-center bg-card border border-border rounded-[14px] rounded-bl-[4px] px-3.5 py-3"
          style={{ opacity: 0, animation: 'fadeUp .25s 4.1s both' }}
        >
          {[0, 200, 400].map(d => (
            <span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-3 flex items-center gap-2">
        <span className="flex-1 text-[0.82rem] text-muted-foreground">
          Type a message...
        </span>
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  )
}

export function HomeHero({
  isSignedIn,
}: {
  isSignedIn: boolean
}): ReactElement {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Radial bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 15% 0%, oklch(0.9245 0.0138 92.9892 / 0.7), transparent),
            radial-gradient(ellipse 50% 70% at 90% 90%, oklch(0.9341 0.0153 90.239 / 0.5), transparent)
          `,
        }}
      />

      <div className="container max-w-6xl mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* ── Left column ── */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-card border border-border rounded-full text-xs font-semibold mb-6"
              style={{ animation: 'fadeUp .5s ease both' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              AI-Powered Sales Automation
            </div>

            <h1
              className="text-[clamp(2.5rem,5vw,3.8rem)] font-black leading-[1.08] tracking-[-0.035em] text-foreground mb-5"
              style={{ animation: 'fadeUp .5s .08s ease both' }}
            >
              Turn Every
              <br />
              Conversation Into a
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(125deg, oklch(0.6171 0.1375 39.0427) 0%, oklch(0.72 0.15 55) 100%)',
                }}
              >
                Conversion
              </span>
            </h1>

            <p
              className="text-lg text-muted-foreground max-w-[460px] leading-[1.75] mb-8"
              style={{ animation: 'fadeUp .5s .16s ease both' }}
            >
              Sendora unifies AI chatbots with automated email marketing to help
              you capture, engage, and convert leads in real time — all from one
              platform.
            </p>

            <div
              className="flex flex-wrap gap-3 mb-3"
              style={{ animation: 'fadeUp .5s .24s ease both' }}
            >
              <Link
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'text-base px-7 py-6',
                )}
                href={isSignedIn ? ROUTES.Dashboard : ROUTES.SignUp}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'text-base px-7 py-6',
                )}
                href="#how-it-works"
              >
                <Play className="w-4 h-4 mr-1" />
                Watch Demo
              </Link>
            </div>

            <p
              className="text-xs text-muted-foreground"
              style={{ animation: 'fadeUp .5s .3s ease both' }}
            >
              No credit card required &nbsp;·&nbsp; Cancel anytime
            </p>

            <div
              className="flex gap-7 pt-7 mt-7 border-t border-border"
              style={{ animation: 'fadeUp .5s .38s ease both' }}
            >
              {[
                { num: '40%', label: 'more leads captured' },
                { num: '80%', label: 'queries automated' },
                { num: '24/7', label: 'AI availability' },
              ].map(s => (
                <div key={s.num}>
                  <span className="block text-[1.6rem] font-black tracking-tight text-foreground leading-none">
                    {s.num}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: Chat mockup ── */}
          <div
            className="relative hidden lg:block"
            style={{ animation: 'fadeUp .6s .2s ease both' }}
          >
            {/* Top-left chip */}
            <div
              className="absolute -top-5 -left-2 z-10 flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-md text-xs whitespace-nowrap"
              style={{ animation: 'fadeIn .5s .55s both' }}
            >
              <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div>
                <strong className="block font-bold text-foreground text-[0.8rem]">
                  New Lead Captured
                </strong>
                <span className="text-muted-foreground">
                  Alex from TechCorp — 2s ago
                </span>
              </div>
            </div>

            <ChatMockup />

            {/* Bottom-right chip */}
            <div
              className="absolute -bottom-4 -right-1/4 z-10 flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-md text-xs whitespace-nowrap"
              style={{ animation: 'fadeIn .5s .75s both' }}
            >
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <strong className="block font-bold text-foreground text-[0.8rem]">
                  Booking confirmed
                </strong>
                <span className="text-muted-foreground">
                  Demo call — Tomorrow 2:00 pm
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:none } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </section>
  )
}
