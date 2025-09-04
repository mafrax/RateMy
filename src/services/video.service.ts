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
    data: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>,
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

      // Extract metadata automatically from video URL
      const extractedMetadata = await videoMetadataService.extractMetadata(validatedData.originalUrl)
      
      // Use extracted data or fallback to provided data
      const finalTitle = data.title?.trim() || extractedMetadata.title
      const finalDescription = data.description?.trim() || extractedMetadata.description || null
      const finalThumbnail = extractedMetadata.thumbnail || null

      // Combine provided tags with extracted tags
      const providedTags = data.tags ? this.extractTagsFromVideo(data) : []
      const combinedTags = Array.from(new Set([...providedTags, ...extractedMetadata.tags]))
      const sanitizedTags = sanitizeTags(combinedTags)

      // Convert original URL to embed URL
      const embedUrl = this.convertToEmbedUrl(validatedData.originalUrl)

      // Detect NSFW content automatically
      const isNSFW = await nsfwService.detectNSFW(finalTitle, finalDescription || undefined)

      // Create video with tags
      const video = await videoRepository.createWithTags({
        title: finalTitle,
        originalUrl: validatedData.originalUrl,
        embedUrl,
        thumbnail: finalThumbnail,
        description: finalDescription,
        isNsfw: isNSFW,
        userId,
      }, sanitizedTags)

      logUserAction('video_created', userId, { 
        videoId: video.id, 
        title: video.title,
        autoExtracted: !data.title || !data.description 
      })

      return {
        success: true,
        data: video,
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