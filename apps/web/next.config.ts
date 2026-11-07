import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@vitrine-academica/permissions'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

export default nextConfig
