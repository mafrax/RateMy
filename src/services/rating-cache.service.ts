import { ratingRepository } from '../repositories/rating.repository'
import { logger } from '../lib/logger'
import { timeRatingOperation } from '../lib/performance-monitor'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface VideoRatingAggregates {
  averageByTag: Map<string, number>
  totalRatings: number
  ratingDistribution: Map<number, number>
}

export class RatingCacheService {
  private videoAverageCache = new Map<string, CacheEntry<Map<string, number>>>()
  private videoAggregateCache = new Map<string, CacheEntry<VideoRatingAggregates>>()
  private userRatingCache = new Map<string, CacheEntry<Map<string, number>>>()
  
  // Cache TTL configurations
  private readonly AVERAGE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly AGGREGATE_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private readonly USER_RATING_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private cleanupExpiredEntries() {
    const now = Date.now()
    
    // Clean up video average cache
    for (const [key, entry] of this.videoAverageCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.videoAverageCache.delete(key)
      }
    }
    
    // Clean up video aggregate cache
    for (const [key, entry] of this.videoAggregateCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.videoAggregateCache.delete(key)
      }
    }
    
    // Clean up user rating cache
    for (const [key, entry] of this.userRatingCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.userRatingCache.delete(key)
      }
    }
  }

  async getVideoAverageRatings(videoId: string, tagId?: string): Promise<Map<string, number>> {
    return timeRatingOperation('cache_get_video_averages', async () => {
      const cacheKey = `${videoId}:${tagId || 'all'}`
      const cached = this.videoAverageCache.get(cacheKey)
      
      if (cached && !this.isExpired(cached)) {
        logger.debug('Cache hit for video average ratings', { videoId, tagId, cacheKey })
        return cached.data
      }

      try {
        let averages: Map<string, number>
        
        if (tagId) {
          // Get average for specific tag
          const average = await ratingRepository.getAverageRating(videoId, tagId)
          averages = new Map([[tagId, average]])
        } else {
          // Get averages for all tags for this video
          const ratings = await ratingRepository.findByVideoId(videoId)
          const tagAverages = new Map<string, { sum: number; count: number }>()
          
          ratings.forEach(rating => {
            const tag = rating.tag.name
            if (!tagAverages.has(tag)) {
              tagAverages.set(tag, { sum: 0, count: 0 })
            }
            const current = tagAverages.get(tag)!
            current.sum += rating.level
            current.count += 1
          })
          
          averages = new Map()
          tagAverages.forEach((value, tag) => {
            averages.set(tag, value.count > 0 ? value.sum / value.count : 0)
          })
        }
        
        // Cache the result
        this.videoAverageCache.set(cacheKey, {
          data: averages,
          timestamp: Date.now(),
          ttl: this.AVERAGE_CACHE_TTL
        })
        
        logger.debug('Cached video average ratings', { videoId, tagId, cacheKey, tagsCount: averages.size })
        return averages
        
      } catch (error) {
        logger.error('Error getting video average ratings', { videoId, tagId, error })
        throw error
      }
    }, { videoId, tagId, cacheKey: `${videoId}:${tagId || 'all'}` })
  }

  async getBulkVideoAverageRatings(videoIds: string[], tagId?: string): Promise<Map<string, Map<string, number>>> {
    const result = new Map<string, Map<string, number>>()
    const uncachedVideoIds = []
    
    // Check cache first
    for (const videoId of videoIds) {
      const cacheKey = `${videoId}:${tagId || 'all'}`
      const cached = this.videoAverageCache.get(cacheKey)
      
      if (cached && !this.isExpired(cached)) {
        result.set(videoId, cached.data)
      } else {
        uncachedVideoIds.push(videoId)
      }
    }
    
    // Fetch uncached data in bulk
    if (uncachedVideoIds.length > 0) {
      try {
        const bulkAverages = await ratingRepository.getAverageRatingsByVideoIds(uncachedVideoIds, tagId)
        
        // Process and cache the results
        for (const videoId of uncachedVideoIds) {
          const average = bulkAverages.get(videoId) || 0
          const averageMap = tagId ? new Map([[tagId, average]]) : new Map([['overall', average]])
          
          result.set(videoId, averageMap)
          
          // Cache the result
          const cacheKey = `${videoId}:${tagId || 'all'}`
          this.videoAverageCache.set(cacheKey, {
            data: averageMap,
            timestamp: Date.now(),
            ttl: this.AVERAGE_CACHE_TTL
          })
        }
        
        logger.debug('Bulk cached video average ratings', { 
          videoIds: uncachedVideoIds.length, 
          tagId,
          cacheHits: videoIds.length - uncachedVideoIds.length,
          cacheMisses: uncachedVideoIds.length
        })
        
      } catch (error) {
        logger.error('Error getting bulk video average ratings', { videoIds: uncachedVideoIds.length, tagId, error })
        throw error
      }
    }
    
    return result
  }

  async getUserRatingForVideo(userId: string, videoId: string, tagId: string): Promise<number | null> {
    const cacheKey = `${userId}:${videoId}`
    const cached = this.userRatingCache.get(cacheKey)
    
    if (cached && !this.isExpired(cached)) {
      return cached.data.get(tagId) || null
    }

    try {
      const ratings = await ratingRepository.findByUserAndVideo(userId, videoId)
      const userRatings = new Map<string, number>()
      
      ratings.forEach(rating => {
        userRatings.set(rating.tagId, rating.level)
      })
      
      // Cache the result
      this.userRatingCache.set(cacheKey, {
        data: userRatings,
        timestamp: Date.now(),
        ttl: this.USER_RATING_CACHE_TTL
      })
      
      return userRatings.get(tagId) || null
      
    } catch (error) {
      logger.error('Error getting user rating for video', { userId, videoId, tagId, error })
      throw error
    }
  }

  invalidateVideoCache(videoId: string) {
    const keysToDelete = []
    
    // Find all cache keys related to this video
    for (const [key] of this.videoAverageCache.entries()) {
      if (key.startsWith(`${videoId}:`)) {
        keysToDelete.push(key)
      }
    }
    
    for (const [key] of this.videoAggregateCache.entries()) {
      if (key === videoId) {
        keysToDelete.push(key)
      }
    }
    
    // Delete the keys
    keysToDelete.forEach(key => {
      this.videoAverageCache.delete(key)
      this.videoAggregateCache.delete(key)
    })
    
    logger.debug('Invalidated video cache', { videoId, keysInvalidated: keysToDelete.length })
  }

  invalidateUserCache(userId: string) {
    const keysToDelete = []
    
    // Find all cache keys related to this user
    for (const [key] of this.userRatingCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key)
      }
    }
    
    // Delete the keys
    keysToDelete.forEach(key => {
      this.userRatingCache.delete(key)
    })
    
    logger.debug('Invalidated user cache', { userId, keysInvalidated: keysToDelete.length })
  }

  // Method to manually trigger cache cleanup
  cleanup() {
    this.cleanupExpiredEntries()
    logger.debug('Rating cache cleanup completed', {
      videoAverageEntries: this.videoAverageCache.size,
      videoAggregateEntries: this.videoAggregateCache.size,
      userRatingEntries: this.userRatingCache.size
    })
  }

  // Get cache statistics
  getStats() {
    return {
      videoAverageCache: {
        size: this.videoAverageCache.size,
        ttl: this.AVERAGE_CACHE_TTL
      },
      videoAggregateCache: {
        size: this.videoAggregateCache.size,
        ttl: this.AGGREGATE_CACHE_TTL
      },
      userRatingCache: {
        size: this.userRatingCache.size,
        ttl: this.USER_RATING_CACHE_TTL
      }
    }
  }
}

// Export singleton instance
export const ratingCacheService = new RatingCacheService()

// Setup periodic cleanup
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    ratingCacheService.cleanup()
  }, 5 * 60 * 1000) // Cleanup every 5 minutes
}