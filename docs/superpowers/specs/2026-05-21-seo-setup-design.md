# SEO Setup Design

**Date:** 2026-05-21  
**Status:** Approved  
**Scope:** Full SEO setup for all pages — Approach B (metadata + robots + sitemap)

---

## Context

Sendora is a B2B SaaS — AI-powered conversational sales and email marketing platform. The app has a public landing page (`/`) and a private authenticated app behind Clerk auth. Only the landing page should be indexed by search engines.

**Production URL:** `https://www.sendora.forum`

---

## Architecture

Uses Next.js App Router's native Metadata API throughout — no external SEO libraries. All metadata is statically declared (no dynamic `generateMetadata` calls needed since private pages don't need dynamic titles). Two new files are added: `app/robots.ts` and `app/sitemap.ts`.

---

## 1. Root Layout Metadata

File: `src/app/layout.tsx`

Add `metadataBase` and a title template so all pages get consistent `<title>` formatting automatically. OG and Twitter Card tags are declared once here and inherited by all pages.

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://www.sendora.forum'),
  title: {
    default: 'Sendora',
    template: '%s | Sendora',
  },
  description: 'AI-powered conversational sales and email marketing platform.',
  openGraph: {
    type: 'website',
    siteName: 'Sendora',
    title: 'Sendora',
    description:
      'AI-powered conversational sales and email marketing platform.',
    url: 'https://www.sendora.forum',
    images: [
      {
        url: '/images/app-ui.png',
        width: 1200,
        height: 630,
        alt: 'Sendora — AI-powered sales platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sendora',
    description:
      'AI-powered conversational sales and email marketing platform.',
    images: ['/images/app-ui.png'],
  },
}
```

`metadataBase` is required for Next.js to resolve relative image paths in OG/Twitter tags correctly.

---

## 2. Per-Page Metadata

### Landing page (`src/app/page.tsx`)

Inherits root metadata entirely — no additional `export const metadata` needed.

### Auth pages

Both sign-in and sign-up get `noindex, nofollow` to prevent indexing of auth flows.

`src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```ts
export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
}
```

`src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```ts
export const metadata: Metadata = {
  title: 'Sign Up',
  robots: { index: false, follow: false },
}
```

### Onboarding (`src/app/onboarding/page.tsx`)

```ts
export const metadata: Metadata = {
  title: 'Onboarding',
  robots: { index: false, follow: false },
}
```

### App pages (all behind Clerk auth — `noindex`)

All private app pages get `noindex` plus human-readable titles for browser tabs. The title template from root layout applies automatically (e.g. `Dashboard | Sendora`).

| File                                | title                  | robots    |
| ----------------------------------- | ---------------------- | --------- |
| `(app)/dashboard/page.tsx`          | `'Dashboard'`          | `noindex` |
| `(app)/conversations/page.tsx`      | `'Conversations'`      | `noindex` |
| `(app)/leads/page.tsx`              | `'Leads'`              | `noindex` |
| `(app)/leads/[leadId]/page.tsx`     | `'Lead Detail'`        | `noindex` |
| `(app)/appointments/page.tsx`       | `'Appointments'`       | `noindex` |
| `(app)/settings/page.tsx`           | `'Settings'`           | `noindex` |
| `(app)/settings/billing/page.tsx`   | `'Billing'`            | `noindex` |
| `(app)/settings/workspace/page.tsx` | `'Workspace Settings'` | `noindex` |
| `(app)/domains/[domainId]/page.tsx` | `'Domain Settings'`    | `noindex` |

### Chatbot widget & Portal

```ts
// src/app/(chatbot)/chatbot/[domainId]/page.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// src/app/(portal)/portal/[token]/page.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

---

## 3. robots.ts

File: `src/app/robots.ts`

Explicitly blocks all private routes. Bots are allowed only on the root landing page (and auth pages, which have `noindex` meta anyway as a second layer of protection).

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/conversations',
          '/leads',
          '/appointments',
          '/settings',
          '/onboarding',
          '/chatbot',
          '/portal',
          '/api',
        ],
      },
    ],
    sitemap: 'https://www.sendora.forum/sitemap.xml',
  }
}
```

---

## 4. sitemap.ts

File: `src/app/sitemap.ts`

Only the public landing page is included. `lastModified` uses the current date at build time.

```ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.sendora.forum',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
```

---

## Files Changed

| Action | File                                             |
| ------ | ------------------------------------------------ |
| Update | `src/app/layout.tsx`                             |
| Update | `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` |
| Update | `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` |
| Update | `src/app/onboarding/page.tsx`                    |
| Update | `src/app/(app)/dashboard/page.tsx`               |
| Update | `src/app/(app)/conversations/page.tsx`           |
| Update | `src/app/(app)/leads/page.tsx`                   |
| Update | `src/app/(app)/leads/[leadId]/page.tsx`          |
| Update | `src/app/(app)/appointments/page.tsx`            |
| Update | `src/app/(app)/settings/page.tsx`                |
| Update | `src/app/(app)/settings/billing/page.tsx`        |
| Update | `src/app/(app)/settings/workspace/page.tsx`      |
| Update | `src/app/(app)/domains/[domainId]/page.tsx`      |
| Update | `src/app/(chatbot)/chatbot/[domainId]/page.tsx`  |
| Update | `src/app/(portal)/portal/[token]/page.tsx`       |
| Create | `src/app/robots.ts`                              |
| Create | `src/app/sitemap.ts`                             |

---

## What's Out of Scope

- JSON-LD / structured data (explicitly excluded)
- Dynamic OG image generation (`@vercel/og`)
- Per-page OG images (static `app-ui.png` covers all pages)
- Canonical link tags (not needed — no duplicate URLs)
- Favicon / apple-touch-icon (existing defaults kept)
