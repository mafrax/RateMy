import { 
  Video, 
  VideoFilters, 
  ApiResponse, 
  PaginatedResponse,
  Rating 
} from '../types'
import { videoRepository } from '../repositories/video.repository'
import { ratingRepository } from '../repositories/rating.repository'
import { tagRepository } from '../repositories/tag.repository'
import { userRepository } from '../repositories/user.repository'
import { videoMetadataService } from './video-metadata.service'
import { nsfwService } from './nsfw.service'
import { redGifsService } from './redgifs.service'
import { redditService } from './reddit.service'
import { xHamsterService } from './xhamster.service'
import { 
  validateSchema, 
  createVideoSchema, 
  updateVideoSchema,
  videoFilterSchema,
  ratingSchema,
  sanitizeTags 
} from '../lib/validation'
import { 
  NotFoundError, 
  AuthorizationError,
  ValidationError,
  createNotFoundError 
} from '../lib/errors'
import { logger, logUserAction } from '../lib/logger'
import { asyncWrapper } from '../lib/errors'
import { VALIDATION_PATTERNS } from '../lib/constants'

export class VideoServiceImpl {
  async getVideos(filters?: VideoFilters): Promise<PaginatedResponse<Video>> {
    return asyncWrapper(async () => {
      const validatedFilters = filters ? validateSchema(videoFilterSchema, filters) : {}
      
      const result = await videoRepository.findWithFilters(validatedFilters)
      
      return {
        success: true,
        data: result.videos,
        pagination: {
          page: validatedFilters.page || 1,
          limit: validatedFilters.limit || 12,
          total: result.total,
          totalPages: result.totalPages,
        },
      }
    })()
  }

  async getVideoById(id: string): Promise<ApiResponse<Video>> {
    return asyncWrapper(async () => {
      const video = await videoRepository.findWithRatings(id)
      
      if (!video) {
        throw createNotFoundError('Video', id)
      }

      return {
        success: true,
        data: video,
      }
    })()
  }

  async createVideo(
    data: Omit<Video, 'id' | 'createdAt' | 'updatedAt'> & { tagRatings?: Array<{name: string, rating: number}> },
    userId: string
  ): Promise<ApiResponse<Video>> {
    return asyncWrapper(async () => {
      // Validate input - originalUrl is required
      const validatedData = validateSchema(createVideoSchema, {
        title: data.title || '', // Allow empty title for auto-extraction
        originalUrl: data.originalUrl,
        description: data.description || '',
        tags: [], // Will be handled by auto-extraction
      })

      // Verify user exists
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      // Check if metadata was already provided from extract-metadata step
      let extractedMetadata, embedUrl, finalThumbnail, previewUrl
      
      if (data.embedUrl && data.thumbnail !== undefined) {
        // Use provided metadata from extract-metadata flow
        extractedMetadata = {
          title: data.title || '',
          description: data.description || '',
          tags: [],
          thumbnail: data.thumbnail
        }
        embedUrl = data.embedUrl
        finalThumbnail = data.thumbnail
        previewUrl = data.previewUrl || null
      } else if (redGifsService.isRedGifsUrl(validatedData.originalUrl)) {
        try {
          const redGifsData = await redGifsService.processRedGifsUrl(validatedData.originalUrl)
          extractedMetadata = {
            title: redGifsData.metadata.title,
            description: redGifsData.metadata.description || '',
            tags: redGifsData.tags,
            thumbnail: redGifsData.thumbnail
          }
          embedUrl = redGifsData.embedUrl // This will be the direct video URL
          finalThumbnail = redGifsData.thumbnail
          logger.info('RedGifs processing successful for video creation', {
            url: validatedData.originalUrl,
            tagsExtracted: redGifsData.tags?.length || 0,
            hasTagRatings: !!data.tagRatings,
            tagRatingsCount: data.tagRatings?.length || 0
          })
        } catch (error) {
          logger.error('Failed to process RedGifs URL, falling back to standard processing', { error })
          extractedMetadata = await videoMetadataService.extractMetadata(validatedData.originalUrl)
          embedUrl = this.convertToEmbedUrl(validatedData.originalUrl)
          finalThumbnail = extractedMetadata.thumbnail || null
        }
      } else if (redditService.isRedditUrl(validatedData.originalUrl)) {
        try {
          const redditData = await redditService.processRedditUrl(validatedData.originalUrl)
          extractedMetadata = {
            title: redditData.metadata.title,
            description: redditData.metadata.description || '',
            tags: redditData.tags,
            thumbnail: redditData.thumbnail
          }
          embedUrl = redditData.embedUrl
          finalThumbnail = redditData.thumbnail
        } catch (error) {
          logger.error('Failed to process Reddit URL, falling back to standard processing', { error })
          extractedMetadata = await videoMetadataService.extractMetadata(validatedData.originalUrl)
          embedUrl = this.convertToEmbedUrl(validatedData.originalUrl)
          finalThumbnail = extractedMetadata.thumbnail || null
        }
      } else if (xHamsterService.isXHamsterUrl(validatedData.originalUrl)) {
        try {
          const xHamsterData = await xHamsterService.processXHamsterUrl(validatedData.originalUrl)
          extractedMetadata = {
            title: xHamsterData.title || '',
            description: xHamsterData.description || '',
            tags: xHamsterData.tags || [],
            thumbnail: xHamsterData.thumbnail
          }
          embedUrl = this.convertToEmbedUrl(validatedData.originalUrl)
          finalThumbnail = xHamsterData.thumbnail || null
          previewUrl = xHamsterData.previewUrl || null
        } catch (error) {
          logger.error('Failed to process XHamster URL, falling back to standard processing', { error })
          extractedMetadata = await videoMetadataService.extractMetadata(validatedData.originalUrl)
          embedUrl = this.convertToEmbedUrl(validatedData.originalUrl)
          finalThumbnail = extractedMetadata.thumbnail || null
        }
      } else {
        // Extract metadata automatically from video URL
        extractedMetadata = await videoMetadataService.extractMetadata(validatedData.originalUrl)
        
        // Convert original URL to embed URL
        embedUrl = this.convertToEmbedUrl(validatedData.originalUrl)
        finalThumbnail = extractedMetadata.thumbnail || null
      }
      
      // Use extracted data or fallback to provided data
      let finalTitle = data.title?.trim() || extractedMetadata.title
      
      // If still no title, generate one from the URL
      if (!finalTitle) {
        if (validatedData.originalUrl.includes('redgifs.com')) {
          const match = validatedData.originalUrl.match(/\/watch\/([a-zA-Z0-9]+)/)
          const gifId = match ? match[1] : 'video'
          finalTitle = `RedGifs ${gifId}`
        } else {
          finalTitle = 'Untitled Video'
        }
      }
      
      const finalDescription = data.description?.trim() || extractedMetadata.description || null

      // Combine provided tags with extracted tags and rated tags
      const providedTags = data.tags ? this.extractTagsFromVideo(data) : []
      const extractedTags = Array.isArray(extractedMetadata.tags) ? extractedMetadata.tags : []
      const ratedTags = data.tagRatings ? data.tagRatings.map(tr => tr.name) : [] // Include all rated tags, even rating 0
      
      const combinedTags = Array.from(new Set([...providedTags, ...extractedTags, ...ratedTags]))
      const sanitizedTags = sanitizeTags(combinedTags)
      
      logger.info('Processing tags for video creation', {
        providedTags: providedTags.length,
        extractedTags: extractedTags.length,
        ratedTags: ratedTags.length,
        combinedTags: combinedTags.length,
        sanitizedTags: sanitizedTags.length,
        finalTags: sanitizedTags
      })

      // Detect NSFW content automatically or use provided value
      let isNSFW: boolean
      if (data.isNsfw !== undefined) {
        // Use provided NSFW status from extract-metadata flow
        isNSFW = data.isNsfw
      } else {
        // Fallback to automatic detection
        const isRedGifs = redGifsService.isRedGifsUrl(validatedData.originalUrl)
        const isReddit = redditService.isRedditUrl(validatedData.originalUrl)
        const isXHamster = xHamsterService.isXHamsterUrl(validatedData.originalUrl)
        
        if (isRedGifs || isXHamster) {
          isNSFW = true // RedGifs and XHamster are automatically NSFW
        } else if (isReddit && Array.isArray(extractedMetadata.tags) && extractedMetadata.tags.includes('nsfw')) {
          isNSFW = true // Reddit marked as NSFW
        } else {
          isNSFW = await nsfwService.detectNSFW(finalTitle, finalDescription || undefined)
        }
      }

      // Create video with tags
      let video
      try {
        video = await videoRepository.createWithTags({
          title: finalTitle,
          originalUrl: validatedData.originalUrl,
          embedUrl,
          thumbnail: finalThumbnail || null,
          previewUrl: previewUrl || null,
          description: finalDescription,
          isNsfw: isNSFW,
          userId,
        }, sanitizedTags)
        
        logger.info('Video created successfully', { 
          videoId: video.id, 
          title: finalTitle,
          tagsCount: sanitizedTags.length 
        })

        // Handle tag ratings if provided
        if (data.tagRatings && data.tagRatings.length > 0) {
          try {
            let ratingsCreated = 0
            logger.info('Creating tag ratings for video', {
              videoId: video.id,
              totalTagRatings: data.tagRatings.length
            })
            
            for (const tagRating of data.tagRatings) {
              if (tagRating.rating >= 0) { // Allow rating 0 (not relevant)
                // Sanitize tag name to ensure consistency with video tags
                const sanitizedTagName = sanitizeTags([tagRating.name])[0]
                if (!sanitizedTagName) continue
                
                // Find or create the tag (ensure it exists)
                const tag = await tagRepository.findOrCreate(sanitizedTagName)
                
                // Check if this tag is actually associated with the video
                const videoHasTag = sanitizedTags.includes(sanitizedTagName)
                
                if (videoHasTag) {
                  // Create a rating for this tag using the upsert method
                  await ratingRepository.upsertRating(
                    video.id,
                    userId,
                    tag.id,
                    tagRating.rating
                  )
                  ratingsCreated++
                } else {
                  logger.warn('Skipping rating for tag not associated with video', {
                    originalTagName: tagRating.name,
                    sanitizedTagName,
                    videoId: video.id
                  })
                }
              }
            }
            
            logger.info('Tag ratings creation completed', {
              videoId: video.id,
              ratingsCreated,
              totalProcessed: data.tagRatings.length
            })
          } catch (ratingError) {
            logger.error('Failed to create tag ratings', {
              error: ratingError,
              videoId: video.id,
              tagRatings: data.tagRatings
            })
            // Don't throw here - video was created successfully, ratings are optional
          }
        }
      } catch (createError) {
        logger.error('Failed to create video in database', {
          error: createError,
          videoData: {
            title: finalTitle,
            originalUrl: validatedData.originalUrl,
            embedUrl,
            thumbnail: finalThumbnail,
            description: finalDescription,
            isNsfw: isNSFW,
            userId,
          },
          tags: sanitizedTags
        })
        throw createError
      }

      logUserAction('video_created', userId, { 
        videoId: video.id, 
        title: video.title,
        autoExtracted: !data.title || !data.description 
      })

      // Refetch the video with all ratings to ensure fresh data
      const videoWithRatings = await videoRepository.findWithRatings(video.id)

      return {
        success: true,
        data: videoWithRatings || video,
      }
    })()
  }

  async updateVideo(
    id: string, 
    data: Partial<Video>,
    userId: string
  ): Promise<ApiResponse<Video>> {
    return asyncWrapper(async () => {
      // Find existing video
      const existingVideo = await videoRepository.findById(id)
      if (!existingVideo) {
        throw createNotFoundError('Video', id)
      }

      // Check ownership
      if (existingVideo.userId !== userId) {
        throw new AuthorizationError('You can only update your own videos')
      }

      // Validate input
      const validatedData = validateSchema(updateVideoSchema, data)

      // Update embed URL if original URL changed
      const updateData: any = { ...validatedData }
      if (validatedData.originalUrl) {
        updateData.embedUrl = this.convertToEmbedUrl(validatedData.originalUrl)
      }

      // Update video
      const updatedVideo = await videoRepository.update(id, updateData)

      logUserAction('video_updated', userId, { videoId: id })

      return {
        success: true,
        data: updatedVideo,
      }
    })()
  }

  async deleteVideo(id: string, userId: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      // Find existing video
      const existingVideo = await videoRepository.findById(id)
      if (!existingVideo) {
        throw createNotFoundError('Video', id)
      }

      // Get user to check if they're admin
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      // Check ownership or admin status
      const isOwner = existingVideo.userId === userId
      const isAdmin = (user as any).isAdmin === true
      
      if (!isOwner && !isAdmin) {
        throw new AuthorizationError('You can only delete your own videos or must be an admin')
      }

      // Delete video (cascade will handle related records)
      await videoRepository.delete(id)

      logUserAction('video_deleted', userId, { 
        videoId: id, 
        title: existingVideo.title,
        isAdminDelete: !isOwner 
      })

      return {
        success: true,
      }
    })()
  }

  async rateVideo(
    videoId: string, 
    tagId: string, 
    level: number,
    userId: string
  ): Promise<ApiResponse<Rating>> {
    return asyncWrapper(async () => {
      // Validate input
      const validatedData = validateSchema(ratingSchema, { tagId, level })

      // Check if video exists
      const video = await videoRepository.findById(videoId)
      if (!video) {
        throw createNotFoundError('Video', videoId)
      }

      // Check if user exists
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      // Check if tag exists
      const tag = await tagRepository.findById(validatedData.tagId)
      if (!tag) {
        throw createNotFoundError('Tag', validatedData.tagId)
      }


      // Upsert rating
      const rating = await ratingRepository.upsertRating(
        videoId,
        userId,
        validatedData.tagId,
        validatedData.level
      )

      logUserAction('video_rated', userId, { 
        videoId, 
        tagId: validatedData.tagId, 
        level: validatedData.level 
      })

      return {
        success: true,
        data: rating,
      }
    })()
  }

  async getVideosByUser(userId: string): Promise<ApiResponse<Video[]>> {
    return asyncWrapper(async () => {
      // Check if user exists
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      const videos = await videoRepository.findByUserId(userId)

      return {
        success: true,
        data: videos,
      }
    })()
  }

  async searchVideos(query: string): Promise<ApiResponse<Video[]>> {
    return asyncWrapper(async () => {
      if (!query || query.trim().length === 0) {
        throw new ValidationError('Search query is required', 'query')
      }

      const videos = await videoRepository.search(query.trim())

      return {
        success: true,
        data: videos,
      }
    })()
  }

  async getVideosByTags(tags: string[]): Promise<ApiResponse<Video[]>> {
    return asyncWrapper(async () => {
      if (!tags || tags.length === 0) {
        throw new ValidationError('At least one tag is required', 'tags')
      }

      const sanitizedTags = sanitizeTags(tags)
      const videos = await videoRepository.findByTags(sanitizedTags)

      return {
        success: true,
        data: videos,
      }
    })()
  }

  async getTrendingVideos(limit: number = 10): Promise<ApiResponse<Video[]>> {
    return asyncWrapper(async () => {
      const videos = await videoRepository.getTrendingVideos(limit)

      return {
        success: true,
        data: videos,
      }
    })()
  }

  async getVideoStats(videoId: string): Promise<ApiResponse<{
    totalRatings: number
    averageRatingByTag: Array<{ tagName: string; averageRating: number; count: number }>
  }>> {
    return asyncWrapper(async () => {
      const video = await videoRepository.findById(videoId)
      if (!video) {
        throw createNotFoundError('Video', videoId)
      }

      const stats = await videoRepository.getVideoStats(videoId)

      return {
        success: true,
        data: stats,
      }
    })()
  }

  private convertToEmbedUrl(originalUrl: string): string {
    // YouTube URLs
    const youtubeMatch = originalUrl.match(VALIDATION_PATTERNS.YOUTUBE_URL)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo URLs
    const vimeoMatch = originalUrl.match(VALIDATION_PATTERNS.VIMEO_URL)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    // RedGifs URLs - fallback if not processed by RedGifs service
    const redgifsRegex = /(?:https?:\/\/)?(?:www\.)?redgifs\.com\/(?:watch\/|ifr\/)([a-zA-Z0-9]+)/i
    const redgifsMatch = originalUrl.match(redgifsRegex)
    if (redgifsMatch) {
      return `https://www.redgifs.com/ifr/${redgifsMatch[1]}`
    }

    // TikTok URLs
    const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/
    const tiktokMatch = originalUrl.match(tiktokRegex)
    if (tiktokMatch) {
      return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`
    }

    // Instagram URLs
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/
    const instagramMatch = originalUrl.match(instagramRegex)
    if (instagramMatch) {
      return `https://www.instagram.com/p/${instagramMatch[1]}/embed/`
    }

    // Twitter/X URLs
    const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/
    const twitterMatch = originalUrl.match(twitterRegex)
    if (twitterMatch) {
      return `https://platform.twitter.com/embed/Tweet.html?id=${twitterMatch[1]}`
    }

    // Dailymotion URLs
    const dailymotionRegex = /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)/
    const dailymotionMatch = originalUrl.match(dailymotionRegex)
    if (dailymotionMatch) {
      return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`
    }

    // Reddit URLs
    const redditRegex = /(?:https?:\/\/)?(?:www\.|old\.|m\.|np\.)?reddit\.com\/r\/(\w+)\/comments\/([a-zA-Z0-9]+)(?:\/([^/]+))?/i
    const redditMatch = originalUrl.match(redditRegex)
    if (redditMatch) {
      return `https://www.reddit.com/r/${redditMatch[1]}/comments/${redditMatch[2]}/`
    }

    // Twitch URLs
    const twitchVideoRegex = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/
    const twitchVideoMatch = originalUrl.match(twitchVideoRegex)
    if (twitchVideoMatch) {
      return `https://player.twitch.tv/?video=${twitchVideoMatch[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`
    }

    const twitchClipRegex = /(?:https?:\/\/)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/
    const twitchClipMatch = originalUrl.match(twitchClipRegex)
    if (twitchClipMatch) {
      return `https://clips.twitch.tv/embed?clip=${twitchClipMatch[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`
    }

    // Direct video files
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v']
    const urlPath = new URL(originalUrl).pathname.toLowerCase()
    if (videoExtensions.some(ext => urlPath.endsWith(ext))) {
      return originalUrl // Return original URL for direct video files
    }

    // If it's already an embed URL or unsupported, return as is
    return originalUrl
  }

  async addTagToVideo(videoId: string, tagId: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      // Check if video exists
      const video = await videoRepository.findById(videoId)
      if (!video) {
        throw createNotFoundError('Video', videoId)
      }

      // Check if tag exists
      const tag = await tagRepository.findById(tagId)
      if (!tag) {
        throw createNotFoundError('Tag', tagId)
      }

      // Add tag to video (repository should handle duplicates)
      await videoRepository.addTagToVideo(videoId, tagId)

      return {
        success: true,
      }
    })()
  }

  async removeTagFromVideo(videoId: string, tagId: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      // Check if video exists
      const video = await videoRepository.findById(videoId)
      if (!video) {
        throw createNotFoundError('Video', videoId)
      }

      // Remove tag from video
      await videoRepository.removeTagFromVideo(videoId, tagId)

      return {
        success: true,
      }
    })()
  }

  private extractTagsFromVideo(data: any): string[] {
    if (data.tags && Array.isArray(data.tags)) {
      return data.tags
    }
    
    if (typeof data.tags === 'string') {
      return data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    }

    return []
  }
}

// Export singleton instance
export const videoService = new VideoServiceImpl()