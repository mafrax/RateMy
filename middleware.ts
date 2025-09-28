import { NextRequest, NextResponse } from 'next/server'

/**
 * Production-grade security headers middleware
 * Enhanced CSP configuration for video platform support
 */

// Enhanced CSP configuration with video platform support
const ENHANCED_CSP = {
  development: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' ws://localhost:* ws://127.0.0.1:*",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://*.phncdn.com https://ei.phncdn.com https://pix-cdn77.phncdn.com https://i.redd.it https://*.redditmedia.com https://*.reddit.com https://preview.redd.it https://external-preview.redd.it https://*.ytimg.com https://img.youtube.com https://*.youtube.com https://*.googleusercontent.com https://*.ggpht.com https://i.imgur.com https://*.imgur.com",
    "media-src 'self' blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://*.phncdn.com https://v.redd.it https://*.youtube.com https://*.googlevideo.com",
    "frame-src 'self' https://www.redgifs.com https://redgifs.com https://www.pornhub.com https://pornhub.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
    "connect-src 'self' https://api.redgifs.com https://www.reddit.com https://www.youtube.com https://*.youtube.com https://www.googleapis.com ws://localhost:* ws://127.0.0.1:*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '),
  
  production: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://*.youtube.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://*.phncdn.com https://ei.phncdn.com https://pix-cdn77.phncdn.com https://i.redd.it https://*.redditmedia.com https://*.reddit.com https://preview.redd.it https://external-preview.redd.it https://*.ytimg.com https://img.youtube.com https://*.youtube.com https://*.googleusercontent.com https://*.ggpht.com https://i.imgur.com https://*.imgur.com",
    "media-src 'self' blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://*.phncdn.com https://v.redd.it https://*.youtube.com https://*.googlevideo.com",
    "frame-src 'self' https://www.redgifs.com https://redgifs.com https://www.pornhub.com https://pornhub.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
    "connect-src 'self' https://api.redgifs.com https://www.reddit.com https://www.youtube.com https://*.youtube.com https://www.googleapis.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

/**
 * Apply security headers to response based on environment
 */
function applySecurityHeaders(response: NextResponse, isStaticAsset: boolean = false): NextResponse {
  // Determine environment
  const environment = (process.env.NODE_ENV as 'development' | 'production') || 'development'
  
  // Get CSP for environment
  let csp = ENHANCED_CSP[environment]
  
  // Remove upgrade-insecure-requests in CI/localhost environments
  if (process.env.CI || process.env.NODE_ENV === 'test') {
    csp = csp.replace('; upgrade-insecure-requests', '')
  }

  // Security headers configuration
  const securityHeaders: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
      'autoplay=(self)',
      'fullscreen=(self)',
      'picture-in-picture=(self)',
      'browsing-topics=()',
      'interest-cohort=()',
      'document-domain=()',
      'unload=()'
    ].join(', '),
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site'
  }

  // Enhanced headers for static assets to prevent content-type sniffing
  if (isStaticAsset) {
    securityHeaders['Cache-Control'] = 'public, max-age=31536000, immutable'
    securityHeaders['Cross-Origin-Resource-Policy'] = 'cross-origin'
    // More permissive COEP for static assets
    securityHeaders['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
  } else {
    // Stricter caching for dynamic content
    securityHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    securityHeaders['Pragma'] = 'no-cache'
    securityHeaders['Expires'] = '0'
  }

  // Add HSTS only for production
  if (environment === 'production') {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Remove potentially sensitive headers
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')

  return response
}

/**
 * Simple middleware function for basic security headers
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply security headers to static assets too, but skip HTTPS redirect
  const isStaticAsset = (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    (pathname.includes('.') && !pathname.startsWith('/api/'))
  )
  
  if (isStaticAsset) {
    const response = NextResponse.next()
    return applySecurityHeaders(response, true) // Mark as static asset
  }

  // HTTPS enforcement in production (bypass for health checks and localhost/CI)
  if (process.env.NODE_ENV === 'production' && 
      !pathname.startsWith('/api/health') &&
      !request.nextUrl.hostname.includes('localhost') &&
      !request.nextUrl.hostname.includes('127.0.0.1') &&
      !process.env.CI &&
      request.headers.get('x-forwarded-proto') !== 'https' &&
      !request.headers.get('x-forwarded-proto')?.includes('https')) {
    
    try {
      if (!request.url || request.url.trim() === '') return
      const httpsUrl = new URL(request.url)
      httpsUrl.protocol = 'https:'
      return NextResponse.redirect(httpsUrl, 301)
    } catch (error) {
      // Invalid URL, skip HTTPS redirect
      console.warn('Invalid URL for HTTPS redirect:', request.url)
    }
  }

  // Create response and apply security headers
  const response = NextResponse.next()
  return applySecurityHeaders(response, false)
}

/**
 * Middleware configuration
 * Defines which routes should be processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths to ensure security headers on all responses
     * Including 404 pages like robots.txt and sitemap.xml
     */
    '/(.*)',
  ],
}

// Simple export for now - complex auth middleware can be added later
export default middleware