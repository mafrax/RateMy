import { createApiRoute, requireAuth } from '@/src/lib/api-handler'
import { ratingRepository } from '@/src/repositories/rating.repository'
import { videoRepository } from '@/src/repositories/video.repository'
import { tagRepository } from '@/src/repositories/tag.repository'
import { ratingCacheService } from '@/src/services/rating-cache.service'
import { logger, logUserAction } from '@/src/lib/logger'

interface PendingRating {
  videoId: string
  tagId: string
  rating: number
  timestamp: number
}

export default createApiRoute({
  POST: requireAuth(async (ctx) => {
    const { user } = ctx
    const body = ctx.req.body

    try {
      // Parse the ratings data - could come from JSON body or sendBeacon
      let ratingsData: PendingRating[]
      
      if (typeof body === 'string') {
        ratingsData = JSON.parse(body)
      } else {
        ratingsData = body
      }

      if (!Array.isArray(ratingsData) || ratingsData.length === 0) {
        return {
          success: false,
          message: 'No ratings provided or invalid format'
        }
      }

      logger.info('Processing bulk rating flush', { 
        userId: user?.id, 
        ratingsCount: ratingsData.length 
      })

      // Validate and prepare ratings data
      const validRatings = []
      const errors = []

      // First pass: validate all ratings
      for (const ratingData of ratingsData) {
        try {
          // Validate rating data
          if (!ratingData.videoId || !ratingData.tagId || typeof ratingData.rating !== 'number') {
            throw new Error('Invalid rating data format')
          }

          // Ensure rating is within valid range (1-5)
          const level = Math.max(1, Math.min(5, Math.round(ratingData.rating)))

          validRatings.push({
            videoId: ratingData.videoId,
            userId: user?.id || '',
            tagId: ratingData.tagId,
            level
          })

        } catch (error) {
          logger.error('Error validating rating in bulk flush', {
            userId: user?.id,
            ratingData,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          errors.push({
            videoId: ratingData.videoId,
            tagId: ratingData.tagId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Early return if no valid ratings
      if (validRatings.length === 0) {
        return {
          success: false,
          message: 'No valid ratings to process',
          data: {
            processed: ratingsData.length,
            successful: 0,
            failed: errors.length,
            errors
          }
        }
      }

      // Get unique video IDs and tag IDs for validation
      const videoIds = Array.from(new Set(validRatings.map(r => r.videoId)))
      const tagIds = Array.from(new Set(validRatings.map(r => r.tagId)))

      // Validate videos and tags exist (batch validation)
      const [existingVideos, existingTags] = await Promise.all([
        Promise.all(videoIds.map(id => videoRepository.findById(id))),
        Promise.all(tagIds.map(id => tagRepository.findById(id)))
      ])

      const validVideoIds = new Set(existingVideos.filter(v => v).map(v => v!.id))
      const validTagIds = new Set(existingTags.filter(t => t).map(t => t!.id))

      // Filter ratings to only include valid ones
      const finalValidRatings = validRatings.filter(rating => 
        validVideoIds.has(rating.videoId) && validTagIds.has(rating.tagId)
      )

      // Track invalid ratings
      const invalidRatings = validRatings.filter(rating => 
        !validVideoIds.has(rating.videoId) || !validTagIds.has(rating.tagId)
      )

      invalidRatings.forEach(rating => {
        const reason = !validVideoIds.has(rating.videoId) 
          ? `Video not found: ${rating.videoId}`
          : `Tag not found: ${rating.tagId}`
        
        errors.push({
          videoId: rating.videoId,
          tagId: rating.tagId,
          error: reason
        })
      })

      let results: Array<{
        videoId: string;
        tagId: string;
        level: number;
        success: boolean;
      }> = []
      
      // Perform bulk upsert if we have valid ratings
      if (finalValidRatings.length > 0) {
        try {
          const upsertedRatings = await ratingRepository.bulkUpsertRatings(finalValidRatings)
          
          results = finalValidRatings.map(rating => ({
            videoId: rating.videoId,
            tagId: rating.tagId,
            level: rating.level,
            success: true
          }))

          // Invalidate cache for affected videos and user
          const uniqueVideoIds = Array.from(new Set(finalValidRatings.map(r => r.videoId)))
          uniqueVideoIds.forEach(videoId => {
            ratingCacheService.invalidateVideoCache(videoId)
          })
          ratingCacheService.invalidateUserCache(user?.id || '')

          // Log bulk action
          logUserAction('bulk_video_rated', user?.id || '', {
            ratingsCount: finalValidRatings.length,
            videoIds: videoIds.length,
            cacheInvalidations: uniqueVideoIds.length + 1, // videos + user
            bulkFlush: true
          })

        } catch (bulkError) {
          logger.error('Error in bulk rating upsert during flush', {
            userId: user?.id,
            ratingsCount: finalValidRatings.length,
            error: bulkError instanceof Error ? bulkError.message : 'Unknown error'
          })

          // If bulk fails, add all as errors
          finalValidRatings.forEach(rating => {
            errors.push({
              videoId: rating.videoId,
              tagId: rating.tagId,
              error: 'Bulk upsert failed'
            })
          })
        }
      }

      logger.info('Bulk rating flush completed', {
        userId: user?.id,
        successful: results.length,
        failed: errors.length,
        total: ratingsData.length
      })

      return {
        success: true,
        data: {
          processed: ratingsData.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined
        },
        message: `Successfully processed ${results.length}/${ratingsData.length} ratings`
      }

    } catch (error) {
      logger.error('Error in bulk rating flush', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        message: 'Failed to process ratings',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}, {
  methods: ['POST'],
  requireAuth: true
})