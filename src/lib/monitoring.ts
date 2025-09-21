import { NextApiRequest, NextApiResponse } from 'next'
import { logger } from './logger'
import { config } from './config'

// Performance monitoring interface
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  labels?: Record<string, string>
}

// Error tracking interface
interface ErrorEvent {
  message: string
  stack?: string
  timestamp: number
  url?: string
  userAgent?: string
  userId?: string
  sessionId?: string
  environment: string
  level: 'error' | 'warning' | 'info'
  context?: Record<string, any>
}

// Request metrics interface
interface RequestMetric {
  method: string
  path: string
  statusCode: number
  duration: number
  timestamp: number
  userAgent?: string
  ip?: string
  userId?: string
}

class MonitoringService {
  private static instance: MonitoringService
  private metrics: PerformanceMetric[] = []
  private errors: ErrorEvent[] = []
  private requests: RequestMetric[] = []

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  // Track application errors
  trackError(error: Error | string, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: Date.now(),
      environment: config.app.env,
      level: 'error',
      context,
    }

    // Log to console/file
    logger.error('Error tracked', errorEvent)

    // Store for metrics endpoint
    this.errors.push(errorEvent)

    // Keep only last 100 errors in memory
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100)
    }

    // Send to external error tracking service (Sentry, etc.)
    this.sendToErrorTracking(errorEvent)
  }

  // Track performance metrics
  trackMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      labels,
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    logger.debug('Metric tracked', metric)
  }

  // Track API requests
  trackRequest(req: NextApiRequest, res: NextApiResponse, duration: number): void {
    const requestMetric: RequestMetric = {
      method: req.method || 'UNKNOWN',
      path: req.url || '/',
      statusCode: res.statusCode,
      duration,
      timestamp: Date.now(),
      userAgent: req.headers['user-agent'],
      ip: this.getClientIP(req),
    }

    this.requests.push(requestMetric)

    // Keep only last 1000 requests in memory
    if (this.requests.length > 1000) {
      this.requests = this.requests.slice(-1000)
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', requestMetric)
    }

    logger.info('Request tracked', requestMetric)
  }

  // Get client IP address
  private getClientIP(req: NextApiRequest): string {
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

  // Send error to external tracking service
  private async sendToErrorTracking(errorEvent: ErrorEvent): Promise<void> {
    // Integration with Sentry, Bugsnag, etc.
    // For now, just log
    if (config.app.env === 'production') {
      // TODO: Implement Sentry integration
      // Sentry.captureException(new Error(errorEvent.message), {
      //   contexts: { error: errorEvent }
      // })
    }
  }

  // Get metrics for Prometheus endpoint
  getMetricsForPrometheus(): string {
    const lines: string[] = []

    // Request metrics
    const requestDurations = this.requests
      .filter(r => r.timestamp > Date.now() - 300000) // Last 5 minutes
      .reduce((acc, req) => {
        const key = `${req.method}_${req.path}_${req.statusCode}`
        if (!acc[key]) {
          acc[key] = { count: 0, sum: 0, method: req.method, path: req.path, status: req.statusCode }
        }
        acc[key].count++
        acc[key].sum += req.duration
        return acc
      }, {} as Record<string, any>)

    // HTTP request duration
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds')
    lines.push('# TYPE http_request_duration_seconds histogram')
    
    Object.values(requestDurations).forEach((metric: any) => {
      lines.push(`http_request_duration_seconds_count{method="${metric.method}",path="${metric.path}",status="${metric.status}"} ${metric.count}`)
      lines.push(`http_request_duration_seconds_sum{method="${metric.method}",path="${metric.path}",status="${metric.status}"} ${metric.sum / 1000}`)
    })

    // HTTP request total
    lines.push('# HELP http_requests_total Total number of HTTP requests')
    lines.push('# TYPE http_requests_total counter')
    
    Object.values(requestDurations).forEach((metric: any) => {
      lines.push(`http_requests_total{method="${metric.method}",path="${metric.path}",status="${metric.status}"} ${metric.count}`)
    })

    // Error rate
    const errorCount = this.errors.filter(e => e.timestamp > Date.now() - 300000).length
    lines.push('# HELP app_errors_total Total number of application errors')
    lines.push('# TYPE app_errors_total counter')
    lines.push(`app_errors_total ${errorCount}`)

    // Custom metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 300000)
    const metricGroups = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric)
      return acc
    }, {} as Record<string, PerformanceMetric[]>)

    Object.entries(metricGroups).forEach(([name, metrics]) => {
      lines.push(`# HELP ${name} Custom application metric`)
      lines.push(`# TYPE ${name} gauge`)
      
      metrics.forEach(metric => {
        const labels = metric.labels ? 
          Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',') : ''
        lines.push(`${name}{${labels}} ${metric.value}`)
      })
    })

    return lines.join('\n')
  }

  // Get error summary
  getErrorSummary(): any {
    const recentErrors = this.errors.filter(e => e.timestamp > Date.now() - 3600000) // Last hour
    
    return {
      totalErrors: recentErrors.length,
      errorsByLevel: recentErrors.reduce((acc, error) => {
        acc[error.level] = (acc[error.level] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    }
  }

  // Get performance summary
  getPerformanceSummary(): any {
    const recentRequests = this.requests.filter(r => r.timestamp > Date.now() - 3600000) // Last hour
    
    if (recentRequests.length === 0) {
      return { totalRequests: 0, averageResponseTime: 0, errorRate: 0 }
    }

    const totalRequests = recentRequests.length
    const averageResponseTime = recentRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests
    const errorRequests = recentRequests.filter(req => req.statusCode >= 400).length
    const errorRate = errorRequests / totalRequests

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100 * 100) / 100, // Percentage with 2 decimal places
      slowRequests: recentRequests.filter(req => req.duration > 1000).length,
      statusCodeDistribution: recentRequests.reduce((acc, req) => {
        const statusGroup = Math.floor(req.statusCode / 100) * 100
        acc[`${statusGroup}xx`] = (acc[`${statusGroup}xx`] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  // Clear old data
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000
    
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    this.errors = this.errors.filter(e => e.timestamp > oneHourAgo)
    this.requests = this.requests.filter(r => r.timestamp > oneHourAgo)
  }
}

// Middleware for request tracking
export function withMonitoring(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now()
    const monitoring = MonitoringService.getInstance()

    try {
      const result = await handler(req, res)
      const duration = Date.now() - start
      monitoring.trackRequest(req, res, duration)
      return result
    } catch (error) {
      const duration = Date.now() - start
      monitoring.trackError(error as Error, { 
        url: req.url, 
        method: req.method,
        userAgent: req.headers['user-agent'] 
      })
      monitoring.trackRequest(req, res, duration)
      throw error
    }
  }
}

// Performance timing utility
export function measurePerformance<T>(
  operation: () => Promise<T>, 
  metricName: string, 
  labels?: Record<string, string>
): Promise<T> {
  const start = Date.now()
  const monitoring = MonitoringService.getInstance()

  return operation()
    .then(result => {
      const duration = Date.now() - start
      monitoring.trackMetric(`${metricName}_duration_ms`, duration, labels)
      monitoring.trackMetric(`${metricName}_success_total`, 1, labels)
      return result
    })
    .catch(error => {
      const duration = Date.now() - start
      monitoring.trackMetric(`${metricName}_duration_ms`, duration, { ...labels, status: 'error' })
      monitoring.trackMetric(`${metricName}_error_total`, 1, labels)
      monitoring.trackError(error, { operation: metricName, ...labels })
      throw error
    })
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance()

// Cleanup interval (run every 10 minutes)
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    monitoring.cleanup()
  }, 600000)
}