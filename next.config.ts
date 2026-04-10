import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
}

export default nextConfig
