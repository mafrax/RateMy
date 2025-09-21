import { NextApiRequest, NextApiResponse } from 'next'
import { monitoring } from '@/src/lib/monitoring'
import { logger } from '@/src/lib/logger'

interface CSPViolation {
  'document-uri': string
  referrer: string
  'violated-directive': string
  'effective-directive': string
  'original-policy': string
  disposition: string
  'blocked-uri': string
  'line-number': number
  'column-number': number
  'source-file': string
  'status-code': number
  'script-sample': string
}

interface CSPReport {
  'csp-report': CSPViolation
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    })
  }

  try {
    const report: CSPReport = req.body

    if (!report || !report['csp-report']) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CSP report format'
      })
    }

    const violation = report['csp-report']

    // Log the violation
    logger.warn('CSP Violation detected', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      userAgent: req.headers['user-agent'],
      ip: getClientIP(req),
    })

    // Track violation in monitoring system
    monitoring.trackError(`CSP Violation: ${violation['violated-directive']}`, {
      type: 'csp-violation',
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      effectiveDirective: violation['effective-directive'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      userAgent: req.headers['user-agent'],
      ip: getClientIP(req),
    })

    // Track CSP violation metric
    monitoring.trackMetric('csp_violations_total', 1, {
      directive: violation['violated-directive'],
      disposition: violation.disposition || 'enforce',
    })

    // Check if this is a common violation that should be addressed
    if (isKnownViolation(violation)) {
      logger.info('Known CSP violation - may need policy update', {
        violatedDirective: violation['violated-directive'],
        blockedUri: violation['blocked-uri'],
      })
    }

    return res.status(204).end() // CSP reports expect 204 No Content
  } catch (error) {
    logger.error('Error processing CSP report', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/csp-report',
      userAgent: req.headers['user-agent'],
    })

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// Get client IP address
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const realIP = req.headers['x-real-ip']
  const remoteAddress = req.socket.remoteAddress

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  if (typeof realIP === 'string') {
    return realIP
  }
  return remoteAddress || 'unknown'
}

// Check if this is a known violation that might indicate a policy update is needed
function isKnownViolation(violation: CSPViolation): boolean {
  const commonViolations = [
    // YouTube-related
    'youtube.com',
    'ytimg.com',
    'googlevideo.com',
    'googleusercontent.com',
    
    // Social media embeds
    'twitter.com',
    'instagram.com',
    'facebook.com',
    
    // CDNs and common services
    'cloudflare.com',
    'amazonaws.com',
    'googletagmanager.com',
    'google-analytics.com',
  ]

  const blockedUri = violation['blocked-uri']
  
  return commonViolations.some(domain => 
    blockedUri && blockedUri.includes(domain)
  )
}

// Disable body parsing for CSP reports (they're sent as text/plain)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}