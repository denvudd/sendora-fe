import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    loader: 'custom',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ucarecdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ucarecdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.ucr.io',
      },
    ],
  },
  async headers() {
    return [
      {
        // Allow the widget to be embedded in iframes on any external site
        source: '/chatbot/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
      {
        // Allow cross-origin script loading of the embed loader
        source: '/chatbot/embed',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      {
        // Allow cross-origin requests to the chat API from embedded widgets
        source: '/api/chat/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

export default nextConfig
