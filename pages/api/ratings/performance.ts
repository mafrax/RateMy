import { createApiRoute, requireAuth } from '@/src/lib/api-handler'
import { performanceMonitor } from '@/src/lib/performance-monitor'
import { ratingCacheService } from '@/src/services/rating-cache.service'
import { logger } from '@/src/lib/logger'

export default createApiRoute({
  GET: requireAuth(async (ctx) => {
    const { user } = ctx
    const { operation } = ctx.req.query

    try {
      // Only allow admin users to access performance metrics
      const userRecord = ctx.user as any
      if (!userRecord.isAdmin) {
        return {
          success: false,
          message: 'Admin access required'
        }
      }

      // Get performance statistics
      const stats = performanceMonitor.getStats(operation as string)
      const slowOperations = performanceMonitor.getSlowOperations(20)
      const operationBreakdown = performanceMonitor.getOperationBreakdown()
      const cacheStats = ratingCacheService.getStats()

      logger.info('Performance metrics requested', {
        userId: user?.id,
        operation,
        statsRequested: true
      })

      return {
        success: true,
        data: {
          performanceStats: stats,
          slowOperations,
          operationBreakdown,
          cacheStats,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      logger.error('Error retrieving performance metrics', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }),

  POST: requireAuth(async (ctx) => {
    const { user } = ctx
    const { action } = ctx.req.body

    try {
      // Only allow admin users to control performance monitoring
      const userRecord = ctx.user as any
      if (!userRecord.isAdmin) {
        return {
          success: false,
          message: 'Admin access required'
        }
      }

      switch (action) {
        case 'clear':
          performanceMonitor.clear()
          logger.info('Performance metrics cleared', { userId: user?.id })
          return {
            success: true,
            message: 'Performance metrics cleared'
          }

        case 'cleanup_cache':
          ratingCacheService.cleanup()
          logger.info('Rating cache cleanup performed', { userId: user?.id })
          return {
            success: true,
            message: 'Cache cleanup completed'
          }

        case 'export':
          const metrics = performanceMonitor.exportMetrics()
          logger.info('Performance metrics exported', { 
            userId: user?.id, 
            metricsCount: metrics.length 
          })
          return {
            success: true,
            data: {
              metrics,
              exportedAt: new Date().toISOString(),
              totalMetrics: metrics.length
            }
          }

        default:
          return {
            success: false,
            message: 'Invalid action. Supported actions: clear, cleanup_cache, export'
          }
      }

    } catch (error) {
      logger.error('Error performing performance action', {
        userId: user?.id,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        message: 'Failed to perform performance action',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}, {
  methods: ['GET', 'POST'],
  requireAuth: true
})