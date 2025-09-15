import { logger } from '@/lib/logger'
import { ValidationError, APIError } from '@/lib/errors'

export interface RedditVideoMetadata {
  postId: string
  subreddit: string
  title: string
  author: string
  description?: string
  videoUrl?: string
  thumbnailUrl?: string
  isNsfw: boolean
  upvotes: number
  comments: number
  createdAt: number
  domain?: string
}

class RedditService {
  private readonly BASE_URL = 'https://www.reddit.com'

  /**
   * Check if URL is a Reddit URL
   */
  public isRedditUrl(url: string): boolean {
    return /(?:https?:\/\/)?(?:www\.|old\.|m\.|np\.)?reddit\.com\/r\/\w+\/comments\/\w+/i.test(url)
  }

  /**
   * Extract Reddit post information from URL
   */
  public extractPostInfo(url: string): { subreddit: string; postId: string; slug?: string } {
    const redditRegex = /(?:https?:\/\/)?(?:www\.|old\.|m\.|np\.)?reddit\.com\/r\/(\w+)\/comments\/([a-zA-Z0-9]+)(?:\/([^/]+))?/i
    const match = url.match(redditRegex)
    
    if (!match) {
      throw new ValidationError('Invalid Reddit URL format')
    }

    return {
      subreddit: match[1],
      postId: match[2],
      slug: match[3]
    }
  }

  /**
   * Get Reddit post metadata
   */
  public async getPostMetadata(url: string): Promise<RedditVideoMetadata> {
    try {
      const { subreddit, postId } = this.extractPostInfo(url)
      
      logger.info('Fetching Reddit post metadata', { subreddit, postId })

      // Use Reddit JSON API to get post data
      const jsonUrl = `${this.BASE_URL}/r/${subreddit}/comments/${postId}.json`
      
      const response = await fetch(jsonUrl, {
        headers: {
          'User-Agent': 'RateMy Video Platform/1.0 (Educational Content Aggregator)',
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        throw new APIError(`Failed to fetch Reddit post: ${response.status}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new ValidationError('Invalid Reddit post response')
      }

      const postData = data[0].data.children[0].data
      
      if (!postData) {
        throw new ValidationError('Reddit post not found')
      }

      // Extract video information
      const videoInfo = this.extractVideoInfo(postData)

      const metadata: RedditVideoMetadata = {
        postId: postData.id,
        subreddit: postData.subreddit,
        title: postData.title,
        author: postData.author,
        description: postData.selftext || undefined,
        videoUrl: videoInfo.videoUrl,
        thumbnailUrl: videoInfo.thumbnailUrl,
        isNsfw: postData.over_18 || false,
        upvotes: postData.ups || 0,
        comments: postData.num_comments || 0,
        createdAt: postData.created_utc || 0,
        domain: postData.domain
      }

      logger.info('Successfully extracted Reddit metadata', { 
        postId: metadata.postId,
        title: metadata.title,
        hasVideo: !!metadata.videoUrl,
        isNsfw: metadata.isNsfw
      })

      return metadata

    } catch (error) {
      logger.error('Failed to fetch Reddit metadata', { url, error })
      throw error
    }
  }

  /**
   * Extract video information from Reddit post data
   */
  private extractVideoInfo(postData: any): { videoUrl?: string; thumbnailUrl?: string } {
    let videoUrl: string | undefined
    let thumbnailUrl: string | undefined

    // Check Reddit Video (v.redd.it)
    if (postData.is_video && postData.media?.reddit_video) {
      videoUrl = postData.media.reddit_video.hls_url || postData.media.reddit_video.fallback_url
      thumbnailUrl = postData.preview?.images?.[0]?.source?.url
    }
    // Check for external video domains
    else if (postData.domain) {
      if (postData.domain.includes('redgifs.com')) {
        // RedGifs content embedded in Reddit
        videoUrl = postData.url
        thumbnailUrl = postData.thumbnail !== 'default' ? postData.thumbnail : undefined
      }
      else if (postData.domain.includes('gfycat.com')) {
        // Gfycat content
        videoUrl = postData.url
        thumbnailUrl = postData.thumbnail !== 'default' ? postData.thumbnail : undefined
      }
      else if (postData.domain.includes('imgur.com')) {
        // Imgur content
        if (postData.url.includes('.gif') || postData.url.includes('.mp4')) {
          videoUrl = postData.url
        }
      }
      else if (postData.domain.includes('streamable.com')) {
        // Streamable content
        videoUrl = postData.url
      }
    }

    // Fallback: check if URL itself is a video
    if (!videoUrl && postData.url) {
      const url = postData.url.toLowerCase()
      if (url.includes('.mp4') || url.includes('.webm') || url.includes('.gif')) {
        videoUrl = postData.url
      }
    }

    // Clean up thumbnail URL if it exists
    if (thumbnailUrl && thumbnailUrl.includes('&amp;')) {
      thumbnailUrl = thumbnailUrl.replace(/&amp;/g, '&')
    }

    return { videoUrl, thumbnailUrl }
  }

  /**
   * Convert Reddit URL to embed format
   */
  public getEmbedUrl(url: string): string {
    try {
      const { subreddit, postId } = this.extractPostInfo(url)
      
      // Reddit doesn't have a direct embed format like YouTube
      // We'll use the Reddit URL directly or create an iframe-friendly version
      return `${this.BASE_URL}/r/${subreddit}/comments/${postId}/embed/`
      
    } catch (error) {
      // Fallback to original URL
      return url
    }
  }

  /**
   * Process Reddit URL for video upload
   */
  public async processRedditUrl(url: string): Promise<{
    embedUrl: string
    thumbnail?: string
    metadata: RedditVideoMetadata
    tags: string[]
  }> {
    try {
      const metadata = await this.getPostMetadata(url)
      
      // Determine embed URL based on content type
      let embedUrl: string
      
      if (metadata.videoUrl && metadata.domain === 'redgifs.com') {
        // Handle RedGifs content embedded in Reddit posts
        const redgifsMatch = metadata.videoUrl.match(/redgifs\.com\/watch\/([a-zA-Z0-9]+)/)
        if (redgifsMatch) {
          const gifId = redgifsMatch[1]
          // Try direct MP4 first, fallback to iframe
          const directUrl = `https://media.redgifs.com/${this.capitalizeGifId(gifId)}.mp4`
          try {
            const testResponse = await fetch(directUrl, { method: 'HEAD' })
            embedUrl = testResponse.ok ? directUrl : `https://www.redgifs.com/ifr/${gifId}?poster=0`
          } catch {
            embedUrl = `https://www.redgifs.com/ifr/${gifId}?poster=0`
          }
        } else {
          embedUrl = metadata.videoUrl
        }
      } else if (metadata.videoUrl) {
        // Use the direct video URL if available
        embedUrl = metadata.videoUrl
      } else {
        // Fallback to Reddit embed (won't work well for video)
        embedUrl = this.getEmbedUrl(url)
      }

      // Generate relevant tags
      const tags = [
        'reddit',
        `r/${metadata.subreddit}`,
        ...(metadata.isNsfw ? ['nsfw'] : ['sfw']),
        ...(metadata.domain ? [metadata.domain] : [])
      ]

      return {
        embedUrl,
        thumbnail: metadata.thumbnailUrl,
        metadata,
        tags: tags // Removed tag limit
      }

    } catch (error) {
      logger.error('Failed to process Reddit URL', { url, error })
      throw error
    }
  }

  /**
   * Get subreddit information
   */
  public async getSubredditInfo(subredditName: string): Promise<{
    name: string
    title: string
    description: string
    isNsfw: boolean
    subscribers: number
  }> {
    try {
      const response = await fetch(`${this.BASE_URL}/r/${subredditName}/about.json`, {
        headers: {
          'User-Agent': 'RateMy Video Platform/1.0 (Educational Content Aggregator)',
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        throw new APIError(`Failed to fetch subreddit info: ${response.status}`)
      }

      const data = await response.json()
      const subredditData = data.data

      return {
        name: subredditData.display_name,
        title: subredditData.title,
        description: subredditData.public_description || subredditData.description,
        isNsfw: subredditData.over18 || false,
        subscribers: subredditData.subscribers || 0
      }

    } catch (error) {
      logger.error('Failed to fetch subreddit info', { subredditName, error })
      throw error
    }
  }
}

export const redditService = new RedditService()