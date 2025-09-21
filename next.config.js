/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization configuration
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.redgifs.com',
      },
      {
        protocol: 'https',
        hostname: '*.xhamster.com',
      },
      {
        protocol: 'https',
        hostname: '*.pornhub.com',
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
      },
      {
        protocol: 'https',
        hostname: '*.redditmedia.com',
      }
    ],
    // Limit image sizes for security
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Maximum image width/height
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Additional security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Download-Options',
            value: 'noopen'
          },
        ],
      },
      // API routes specific headers
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      }
    ]
  },

  // Request body size limits
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Environment variables validation
  env: {
    // Only expose public environment variables
    VERCEL_URL: process.env.VERCEL_URL,
  },

  // Webpack configuration for production optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization = {
        ...config.optimization,
        minimize: true,
        sideEffects: false,
      }
    }

    return config
  },
}

module.exports = nextConfig