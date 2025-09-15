import { logger } from './logger'

interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000 // Keep last 1000 operations
  private timers = new Map<string, number>()

  // Start timing an operation
  start(operationId: string, operation: string, metadata?: Record<string, any>): void {
    this.timers.set(operationId, performance.now())
    if (metadata) {
      logger.debug(`Performance monitor: Starting ${operation}`, metadata)
    }
  }

  // End timing an operation and record the metric
  end(operationId: string, operation: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(operationId)
    if (!startTime) {
      logger.warn(`Performance monitor: No start time found for operation ${operationId}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(operationId)

    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    }

    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations (> 1000ms)
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${operation}`, {
        duration,
        operationId,
        ...metadata
      })
    } else if (duration > 100) {
      // Log medium operations for debugging
      logger.debug(`Performance: ${operation} took ${duration.toFixed(2)}ms`, {
        operationId,
        ...metadata
      })
    }

    return duration
  }

  // Time a function execution
  async timeFunction<T>(
    operation: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    const operationId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.start(operationId, operation, metadata)
    try {
      const result = await fn()
      const duration = this.end(operationId, operation, metadata)
      return { result, duration }
    } catch (error) {
      const duration = this.end(operationId, operation, { ...metadata, error: true })
      throw error
    }
  }

  // Get performance statistics
  getStats(operation?: string): {
    totalOperations: number
    averageDuration: number
    minDuration: number
    maxDuration: number
    recentOperations: number
    slowOperations: number
  } {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        recentOperations: 0,
        slowOperations: 0
      }
    }

    const durations = filteredMetrics.map(m => m.duration)
    const recentCutoff = Date.now() - 5 * 60 * 1000 // Last 5 minutes
    
    return {
      totalOperations: filteredMetrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      recentOperations: filteredMetrics.filter(m => m.timestamp > recentCutoff).length,
      slowOperations: filteredMetrics.filter(m => m.duration > 1000).length
    }
  }

  // Get recent slow operations
  getSlowOperations(limit = 10): Array<{
    operation: string
    duration: number
    timestamp: number
    metadata?: Record<string, any>
  }> {
    return this.metrics
      .filter(m => m.duration > 1000)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(m => ({
        operation: m.operation,
        duration: m.duration,
        timestamp: m.timestamp,
        metadata: m.metadata
      }))
  }

  // Get operation breakdown
  getOperationBreakdown(): Record<string, {
    count: number
    totalDuration: number
    averageDuration: number
    maxDuration: number
  }> {
    const breakdown: Record<string, {
      count: number
      totalDuration: number
      averageDuration: number
      maxDuration: number
    }> = {}

    this.metrics.forEach(metric => {
      if (!breakdown[metric.operation]) {
        breakdown[metric.operation] = {
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
          maxDuration: 0
        }
      }

      const op = breakdown[metric.operation]
      op.count += 1
      op.totalDuration += metric.duration
      op.maxDuration = Math.max(op.maxDuration, metric.duration)
    })

    // Calculate averages
    Object.values(breakdown).forEach(op => {
      op.averageDuration = op.totalDuration / op.count
    })

    return breakdown
  }

  // Clear all metrics
  clear(): void {
    this.metrics = []
    this.timers.clear()
    logger.info('Performance monitor cleared')
  }

  // Export metrics for analysis
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Helper function for timing rating operations specifically
export const timeRatingOperation = async <T>(
  operation: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> => {
  const { result } = await performanceMonitor.timeFunction(
    `rating_${operation}`,
    fn,
    metadata
  )
  return result
}