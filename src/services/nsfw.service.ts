import { videoRepository } from '@/repositories/video.repository'
import { logger, logUserAction } from '@/lib/logger'
import { ValidationError, NotFoundError } from '@/lib/errors'

export class NSFWService {
  
  /**
   * Automatically detect if a video is NSFW based on title and description
   * Uses keyword matching for basic detection
   */
  async detectNSFW(title: string, description?: string): Promise<boolean> {
    const nsfwKeywords = [
      // Explicit terms
      'porn', 'sex', 'nude', 'naked', 'adult', 'xxx', 'nsfw',
      'explicit', 'erotic', 'fetish', 'masturbat', 'orgasm',
      // Body parts (common in NSFW content)
      'boobs', 'tits', 'ass', 'pussy', 'dick', 'cock', 'penis',
      'vagina', 'breast', 'nipple',
      // Action words
      'fuck', 'fucking', 'bang', 'screw', 'cum', 'cumming',
      // Slang and abbreviations  
      'milf', 'dilf', 'bbc', 'bwc', 'bj', 'blowjob',
      // Common NSFW site indicators
      'onlyfans', 'pornhub', 'xvideos', 'xhamster',
      // Age-related (concerning)
      'teen', '18+', '19+', 'young', 'schoolgirl',
      // Context clues
      'tight', 'wet', 'hard', 'horny', 'kinky', 'dirty'
    ]

    const textToCheck = `${title} ${description || ''}`.toLowerCase()
    
    const isNSFW = nsfwKeywords.some(keyword => 
      textToCheck.includes(keyword.toLowerCase())
    )

    if (isNSFW) {
      logger.info('NSFW content detected', {
        title: title.substring(0, 50) + '...',
        detectionMethod: 'keyword_matching',
        keywords: nsfwKeywords.filter(k => textToCheck.includes(k))
      })
    }

    return isNSFW
  }

  /**
   * Mark a video as NSFW or safe (manual override)
   */
  async markVideo(videoId: string, isNSFW: boolean, userId: string): Promise<void> {
    try {
      // Validate input
      if (!videoId?.trim()) {
        throw new ValidationError('Video ID is required')
      }
      if (!userId?.trim()) {
        throw new ValidationError('User ID is required')
      }

      // Check if video exists
      const video = await videoRepository.findById(videoId)
      if (!video) {
        throw new NotFoundError('Video not found')
      }

      // Update the video's NSFW status
      await videoRepository.update(videoId, {
        isNsfw: isNSFW
      })

      // Log the action
      logUserAction(
        isNSFW ? 'mark_video_nsfw' : 'mark_video_safe',
        userId,
        {
          videoId,
          videoTitle: video.title,
          previousStatus: video.isNsfw,
          newStatus: isNSFW
        }
      )

      logger.info('Video NSFW status updated', {
        videoId,
        isNSFW,
        userId,
        action: isNSFW ? 'marked_nsfw' : 'marked_safe'
      })

    } catch (error) {
      logger.error('Failed to update video NSFW status', {
        videoId,
        isNSFW,
        userId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Bulk scan and update NSFW status for all videos
   * Useful for initial setup or periodic re-scanning
   */
  async bulkScanVideos(userId: string): Promise<{ scanned: number, updated: number }> {
    try {
      const videos = await videoRepository.findAll()
      let scanned = 0
      let updated = 0

      for (const video of videos) {
        scanned++
        const detectedNSFW = await this.detectNSFW(video.title, video.description || undefined)
        
        // Only update if detection differs from current status
        if (detectedNSFW !== video.isNsfw) {
          await this.markVideo(video.id, detectedNSFW, userId)
          updated++
        }
      }

      logUserAction('bulk_nsfw_scan', userId, {
        videosScanned: scanned,
        videosUpdated: updated
      })

      logger.info('Bulk NSFW scan completed', {
        scanned,
        updated,
        userId
      })

      return { scanned, updated }

    } catch (error) {
      logger.error('Bulk NSFW scan failed', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Get NSFW statistics
   */
  async getNSFWStats(): Promise<{
    total: number
    nsfwCount: number
    safeCount: number
    percentage: number
  }> {
    try {
      const allVideos = await videoRepository.findAll()
      const total = allVideos.length
      const nsfwCount = allVideos.filter(v => v.isNsfw).length
      const safeCount = total - nsfwCount
      const percentage = total > 0 ? (nsfwCount / total) * 100 : 0

      return {
        total,
        nsfwCount,
        safeCount,
        percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
      }
    } catch (error) {
      logger.error('Failed to get NSFW stats', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

// Create singleton instance
export const nsfwService = new NSFWService()