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
