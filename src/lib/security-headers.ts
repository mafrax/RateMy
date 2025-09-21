/**
 * Security Headers Configuration
 * Flexible CSP and security headers management for different environments
 */

interface CSPConfig {
  defaultSrc: string[]
  scriptSrc: string[]
  styleSrc: string[]
  imgSrc: string[]
  mediaSrc: string[]
  frameSrc: string[]
  connectSrc: string[]
  fontSrc: string[]
  objectSrc: string[]
  baseUri: string[]
  formAction: string[]
  frameAncestors: string[]
  upgradeInsecureRequests: boolean
}

interface SecurityConfig {
  csp: CSPConfig
  strictTransportSecurity: string
  xFrameOptions: string
  xContentTypeOptions: string
  xXSSProtection: string
  referrerPolicy: string
  permissionsPolicy: string[]
  crossOriginEmbedderPolicy: string
  crossOriginOpenerPolicy: string
  crossOriginResourcePolicy: string
}

// Base CSP configuration
const BASE_CSP: CSPConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Next.js development
    "'unsafe-eval'", // Required for some Next.js features
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and inline styles
    "https://fonts.googleapis.com",
  ],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
  ],
  mediaSrc: [
    "'self'",
    "blob:",
  ],
  frameSrc: [
    "'self'",
  ],
  connectSrc: [
    "'self'",
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: true,
}

// Video platform specific CSP extensions
const VIDEO_PLATFORMS = {
  youtube: {
    scriptSrc: [
      "https://www.youtube.com",
      "https://*.youtube.com",
    ],
    imgSrc: [
      "https://*.ytimg.com",
      "https://*.googleusercontent.com",
      "https://*.ggpht.com",
    ],
    mediaSrc: [
      "https://*.youtube.com",
      "https://*.googlevideo.com",
    ],
    frameSrc: [
      "https://www.youtube.com",
      "https://youtube.com",
      "https://www.youtube-nocookie.com",
    ],
    connectSrc: [
      "https://www.youtube.com",
      "https://*.youtube.com",
      "https://www.googleapis.com",
    ],
  },
  redgifs: {
    imgSrc: [
      "https://*.redgifs.com",
      "https://redgifs.com",
    ],
    mediaSrc: [
      "https://*.redgifs.com",
      "https://redgifs.com",
    ],
    frameSrc: [
      "https://www.redgifs.com",
      "https://redgifs.com",
    ],
    connectSrc: [
      "https://api.redgifs.com",
    ],
  },
  pornhub: {
    imgSrc: [
      "https://*.pornhub.com",
      "https://pornhub.com",
    ],
    mediaSrc: [
      "https://*.pornhub.com",
      "https://pornhub.com",
    ],
    frameSrc: [
      "https://www.pornhub.com",
      "https://pornhub.com",
    ],
  },
  xhamster: {
    imgSrc: [
      "https://*.xhamster.com",
      "https://xhamster.com",
    ],
    mediaSrc: [
      "https://*.xhamster.com",
      "https://xhamster.com",
    ],
  },
  reddit: {
    imgSrc: [
      "https://i.redd.it",
      "https://*.redditmedia.com",
      "https://preview.redd.it",
      "https://external-preview.redd.it",
    ],
    mediaSrc: [
      "https://v.redd.it",
    ],
    connectSrc: [
      "https://www.reddit.com",
      "https://api.reddit.com",
    ],
  },
  imgur: {
    imgSrc: [
      "https://i.imgur.com",
      "https://*.imgur.com",
    ],
  },
}

// Analytics and tracking services
const ANALYTICS_SERVICES = {
  google: {
    scriptSrc: [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://googleads.g.doubleclick.net",
    ],
    imgSrc: [
      "https://www.google-analytics.com",
      "https://googleads.g.doubleclick.net",
    ],
    connectSrc: [
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://region1.google-analytics.com",
    ],
  },
}

// Build CSP configuration for specific environment
function buildCSPConfig(environment: 'development' | 'staging' | 'production'): CSPConfig {
  const config: CSPConfig = JSON.parse(JSON.stringify(BASE_CSP)) // Deep clone

  // Add video platform sources
  Object.values(VIDEO_PLATFORMS).forEach(platform => {
    Object.entries(platform).forEach(([directive, sources]) => {
      if (config[directive as keyof CSPConfig]) {
        (config[directive as keyof CSPConfig] as string[]).push(...sources)
      }
    })
  })

  // Add analytics for production and staging
  if (environment !== 'development') {
    Object.values(ANALYTICS_SERVICES).forEach(service => {
      Object.entries(service).forEach(([directive, sources]) => {
        if (config[directive as keyof CSPConfig]) {
          (config[directive as keyof CSPConfig] as string[]).push(...sources)
        }
      })
    })
  }

  // Development-specific relaxations
  if (environment === 'development') {
    config.connectSrc.push('ws://localhost:*', 'ws://127.0.0.1:*') // Hot reload
    config.scriptSrc.push("'unsafe-eval'") // Development tools
  }

  return config
}

// Convert CSP config to string
function cspConfigToString(config: CSPConfig): string {
  const directives = []

  // Add each directive
  if (config.defaultSrc.length) directives.push(`default-src ${config.defaultSrc.join(' ')}`)
  if (config.scriptSrc.length) directives.push(`script-src ${config.scriptSrc.join(' ')}`)
  if (config.styleSrc.length) directives.push(`style-src ${config.styleSrc.join(' ')}`)
  if (config.imgSrc.length) directives.push(`img-src ${config.imgSrc.join(' ')}`)
  if (config.mediaSrc.length) directives.push(`media-src ${config.mediaSrc.join(' ')}`)
  if (config.frameSrc.length) directives.push(`frame-src ${config.frameSrc.join(' ')}`)
  if (config.connectSrc.length) directives.push(`connect-src ${config.connectSrc.join(' ')}`)
  if (config.fontSrc.length) directives.push(`font-src ${config.fontSrc.join(' ')}`)
  if (config.objectSrc.length) directives.push(`object-src ${config.objectSrc.join(' ')}`)
  if (config.baseUri.length) directives.push(`base-uri ${config.baseUri.join(' ')}`)
  if (config.formAction.length) directives.push(`form-action ${config.formAction.join(' ')}`)
  if (config.frameAncestors.length) directives.push(`frame-ancestors ${config.frameAncestors.join(' ')}`)
  if (config.upgradeInsecureRequests) directives.push('upgrade-insecure-requests')

  return directives.join('; ')
}

// Get security configuration for environment
export function getSecurityConfig(environment: 'development' | 'staging' | 'production'): SecurityConfig {
  const cspConfig = buildCSPConfig(environment)

  return {
    csp: cspConfig,
    strictTransportSecurity: environment === 'development' 
      ? '' // No HSTS in development
      : 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'SAMEORIGIN', // Allow same-origin framing for embeds
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
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
    ],
    crossOriginEmbedderPolicy: 'unsafe-none', // Required for video embeds
    crossOriginOpenerPolicy: 'same-origin-allow-popups',
    crossOriginResourcePolicy: 'cross-origin',
  }
}

// Get security headers object for middleware
export function getSecurityHeaders(environment: 'development' | 'staging' | 'production'): Record<string, string> {
  const config = getSecurityConfig(environment)
  const headers: Record<string, string> = {
    'Content-Security-Policy': cspConfigToString(config.csp),
    'X-Content-Type-Options': config.xContentTypeOptions,
    'X-XSS-Protection': config.xXSSProtection,
    'Referrer-Policy': config.referrerPolicy,
    'Permissions-Policy': config.permissionsPolicy.join(', '),
    'Cross-Origin-Embedder-Policy': config.crossOriginEmbedderPolicy,
    'Cross-Origin-Opener-Policy': config.crossOriginOpenerPolicy,
    'Cross-Origin-Resource-Policy': config.crossOriginResourcePolicy,
  }

  // Add HSTS only for non-development environments
  if (config.strictTransportSecurity) {
    headers['Strict-Transport-Security'] = config.strictTransportSecurity
  }

  // Add X-Frame-Options
  headers['X-Frame-Options'] = config.xFrameOptions

  return headers
}

// CSP violation reporting endpoint configuration
export function getCSPReportConfig(environment: 'development' | 'staging' | 'production'): string {
  const reportUri = environment === 'production' 
    ? 'https://ratemy.app/api/csp-report'
    : environment === 'staging'
    ? 'https://staging.ratemy.app/api/csp-report'
    : 'http://localhost:3000/api/csp-report'

  return `; report-uri ${reportUri}; report-to csp-endpoint`
}

// Add CSP reporting if needed
export function addCSPReporting(cspHeader: string, environment: 'development' | 'staging' | 'production'): string {
  return cspHeader + getCSPReportConfig(environment)
}