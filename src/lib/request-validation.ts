import { NextRequest } from 'next/server'
import { logger } from './logger'

/**
 * Request validation and size limiting utilities
 * Provides security controls for incoming requests
 */

export interface RequestLimits {
  maxBodySize: number      // Maximum request body size in bytes
  maxUrlLength: number     // Maximum URL length
  maxHeaderSize: number    // Maximum total header size
  maxQueryParams: number   // Maximum number of query parameters
  maxCookieSize: number    // Maximum cookie size
  allowedMethods: string[] // Allowed HTTP methods
  requiredHeaders?: string[] // Required headers
  blockedUserAgents?: RegExp[] // Blocked user agent patterns
}

export interface ValidationResult {
  valid: boolean
  error?: string
  details?: Record<string, any>
}

// Default request limits based on security best practices
export const DEFAULT_REQUEST_LIMITS: RequestLimits = {
  maxBodySize: 10 * 1024 * 1024,        // 10MB
  maxUrlLength: 2048,                    // 2KB
  maxHeaderSize: 8 * 1024,               // 8KB
  maxQueryParams: 50,                    // 50 parameters
  maxCookieSize: 4096,                   // 4KB
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  blockedUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    // Add patterns for known malicious user agents
    /nmap/i,
    /nikto/i,
    /sqlmap/i,
    /dirb/i,
    /dirbuster/i,
  ]
}

// Route-specific limits
export const ROUTE_LIMITS: Record<string, Partial<RequestLimits>> = {
  '/api/videos': {
    maxBodySize: 50 * 1024 * 1024, // 50MB for video uploads
  },
  '/api/auth': {
    maxBodySize: 1024,              // 1KB for auth requests
    allowedMethods: ['POST'],
  },
  '/api/ratings': {
    maxBodySize: 2048,              // 2KB for ratings
    allowedMethods: ['GET', 'POST', 'PUT'],
  },
  '/api/users': {
    maxBodySize: 5 * 1024,          // 5KB for user data
  }
}

/**
 * Get request limits for a specific route
 */
export function getRequestLimits(pathname: string): RequestLimits {
  const baseLimits = { ...DEFAULT_REQUEST_LIMITS }
  
  // Find matching route limit
  for (const [route, limits] of Object.entries(ROUTE_LIMITS)) {
    if (pathname.startsWith(route)) {
      return { ...baseLimits, ...limits }
    }
  }
  
  return baseLimits
}

/**
 * Validate request method
 */
export function validateMethod(method: string, allowedMethods: string[]): ValidationResult {
  if (!allowedMethods.includes(method.toUpperCase())) {
    return {
      valid: false,
      error: 'Method not allowed',
      details: { method, allowedMethods }
    }
  }
  
  return { valid: true }
}

/**
 * Validate URL length
 */
export function validateUrlLength(url: string, maxLength: number): ValidationResult {
  if (url.length > maxLength) {
    return {
      valid: false,
      error: 'URL too long',
      details: { urlLength: url.length, maxLength }
    }
  }
  
  return { valid: true }
}

/**
 * Validate request headers
 */
export function validateHeaders(
  headers: Headers, 
  maxHeaderSize: number,
  requiredHeaders?: string[]
): ValidationResult {
  // Calculate total header size
  let totalHeaderSize = 0
  const headerEntries: string[][] = []
  
  headers.forEach((value, key) => {
    headerEntries.push([key, value])
    totalHeaderSize += key.length + value.length + 4 // +4 for ": " and "\r\n"
  })
  
  if (totalHeaderSize > maxHeaderSize) {
    return {
      valid: false,
      error: 'Headers too large',
      details: { totalHeaderSize, maxHeaderSize }
    }
  }
  
  // Check required headers
  if (requiredHeaders) {
    for (const requiredHeader of requiredHeaders) {
      if (!headers.get(requiredHeader)) {
        return {
          valid: false,
          error: 'Missing required header',
          details: { requiredHeader }
        }
      }
    }
  }
  
  return { valid: true }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  maxQueryParams: number
): ValidationResult {
  const paramCount = Array.from(searchParams.keys()).length
  
  if (paramCount > maxQueryParams) {
    return {
      valid: false,
      error: 'Too many query parameters',
      details: { paramCount, maxQueryParams }
    }
  }
  
  return { valid: true }
}

/**
 * Validate cookies
 */
export function validateCookies(
  cookieHeader: string | null,
  maxCookieSize: number
): ValidationResult {
  if (!cookieHeader) {
    return { valid: true }
  }
  
  if (cookieHeader.length > maxCookieSize) {
    return {
      valid: false,
      error: 'Cookies too large',
      details: { cookieSize: cookieHeader.length, maxCookieSize }
    }
  }
  
  return { valid: true }
}

/**
 * Validate user agent
 */
export function validateUserAgent(
  userAgent: string | null,
  blockedPatterns?: RegExp[]
): ValidationResult {
  if (!userAgent || !blockedPatterns) {
    return { valid: true }
  }
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(userAgent)) {
      return {
        valid: false,
        error: 'Blocked user agent',
        details: { userAgent: userAgent.substring(0, 100), pattern: pattern.toString() }
      }
    }
  }
  
  return { valid: true }
}

/**
 * Validate request body size (for API routes)
 */
export async function validateBodySize(
  request: Request,
  maxBodySize: number
): Promise<ValidationResult> {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (isNaN(size)) {
      return {
        valid: false,
        error: 'Invalid content length header'
      }
    }
    
    if (size > maxBodySize) {
      return {
        valid: false,
        error: 'Request body too large',
        details: { contentLength: size, maxBodySize }
      }
    }
  }
  
  // For requests without content-length, we need to read the body
  // This is more expensive but necessary for security
  try {
    const body = await request.clone().arrayBuffer()
    if (body.byteLength > maxBodySize) {
      return {
        valid: false,
        error: 'Request body too large',
        details: { actualSize: body.byteLength, maxBodySize }
      }
    }
  } catch (error) {
    logger.error('Failed to validate request body size', { error })
    return {
      valid: false,
      error: 'Failed to validate request body'
    }
  }
  
  return { valid: true }
}

/**
 * Comprehensive request validation
 */
export async function validateRequest(
  request: NextRequest,
  customLimits?: Partial<RequestLimits>
): Promise<ValidationResult> {
  const { pathname } = request.nextUrl
  const limits = customLimits ? 
    { ...getRequestLimits(pathname), ...customLimits } : 
    getRequestLimits(pathname)

  // Validate method
  const methodResult = validateMethod(request.method, limits.allowedMethods)
  if (!methodResult.valid) {
    logger.warn('Request validation failed: invalid method', methodResult.details)
    return methodResult
  }

  // Validate URL length
  const urlResult = validateUrlLength(request.url, limits.maxUrlLength)
  if (!urlResult.valid) {
    logger.warn('Request validation failed: URL too long', urlResult.details)
    return urlResult
  }

  // Validate headers
  const headerResult = validateHeaders(
    request.headers, 
    limits.maxHeaderSize,
    limits.requiredHeaders
  )
  if (!headerResult.valid) {
    logger.warn('Request validation failed: invalid headers', headerResult.details)
    return headerResult
  }

  // Validate query parameters
  const queryResult = validateQueryParams(request.nextUrl.searchParams, limits.maxQueryParams)
  if (!queryResult.valid) {
    logger.warn('Request validation failed: too many query params', queryResult.details)
    return queryResult
  }

  // Validate cookies
  const cookieResult = validateCookies(
    request.headers.get('cookie'),
    limits.maxCookieSize
  )
  if (!cookieResult.valid) {
    logger.warn('Request validation failed: cookies too large', cookieResult.details)
    return cookieResult
  }

  // Validate user agent
  const userAgentResult = validateUserAgent(
    request.headers.get('user-agent'),
    limits.blockedUserAgents
  )
  if (!userAgentResult.valid) {
    logger.warn('Request validation failed: blocked user agent', userAgentResult.details)
    return userAgentResult
  }

  // Validate body size for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const bodyResult = await validateBodySize(request, limits.maxBodySize)
    if (!bodyResult.valid) {
      logger.warn('Request validation failed: body too large', bodyResult.details)
      return bodyResult
    }
  }

  logger.debug('Request validation passed', {
    path: pathname,
    method: request.method,
    limits
  })

  return { valid: true }
}

/**
 * Sanitize and validate common input patterns
 */
export class InputSanitizer {
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /('|(\\')|(;)|(\\)|(--)|(%27)|(%3D)|(%3C)|(%3E)|(%00))/i,
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i,
    /((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))[^\n]+((\%3E)|>)/i
  ]

  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi
  ]

  static validateInput(input: string, type: 'sql' | 'xss' | 'all' = 'all'): ValidationResult {
    const patterns = type === 'sql' ? this.SQL_INJECTION_PATTERNS :
                    type === 'xss' ? this.XSS_PATTERNS :
                    [...this.SQL_INJECTION_PATTERNS, ...this.XSS_PATTERNS]

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return {
          valid: false,
          error: 'Potentially malicious input detected',
          details: { pattern: pattern.toString(), input: input.substring(0, 100) }
        }
      }
    }

    return { valid: true }
  }

  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }
}