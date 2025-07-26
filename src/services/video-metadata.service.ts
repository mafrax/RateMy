import { logger } from '../lib/logger'
import { VALIDATION_PATTERNS } from '../lib/constants'

export interface VideoMetadata {
  title: string
  description?: string
  tags: string[]
  thumbnail?: string
  duration?: number
  platform?: string
}

export class VideoMetadataService {
  private readonly supportedPlatforms = {
    youtube: {
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
      ],
      extract: (videoId: string) => this.extractYouTubeMetadata(videoId)
    },
    vimeo: {
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
        /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/
      ],
      extract: (videoId: string) => this.extractVimeoMetadata(videoId)
    },
    tiktok: {
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
        /(?:https?:\/\/)?vm\.tiktok\.com\/([a-zA-Z0-9]+)/
      ],
      extract: (videoId: string) => this.extractTikTokMetadata(videoId)
    },
    instagram: {
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/,
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/tv\/([a-zA-Z0-9_-]+)/
      ],
      extract: (videoId: string) => this.extractInstagramMetadata(videoId)
    },
    twitter: {
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/
      ],
      extract: (videoId: string) => this.extractTwitterMetadata(videoId)
    },
    dailymotion: {
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)/
      ],
      extract: (videoId: string) => this.extractDailymotionMetadata(videoId)
    },
    twitch: {
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/,
        /(?:https?:\/\/)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/
      ],
      extract: (videoId: string) => this.extractTwitchMetadata(videoId)
    }
  }

  async extractMetadata(originalUrl: string): Promise<VideoMetadata> {
    try {
      // Check for direct video file URLs
      if (this.isDirectVideoFile(originalUrl)) {
        return this.extractDirectVideoMetadata(originalUrl)
      }

      // Try to match against supported platforms
      for (const [platform, config] of Object.entries(this.supportedPlatforms)) {
        for (const pattern of config.patterns) {
          const match = originalUrl.match(pattern)
          if (match) {
            const videoId = match[1]
            logger.info(`Extracting metadata for ${platform}`, { videoId, originalUrl })
            return await config.extract(videoId)
          }
        }
      }

      // Try generic oEmbed extraction
      const oEmbedResult = await this.extractOEmbedMetadata(originalUrl)
      if (oEmbedResult) {
        return oEmbedResult
      }

      // Fallback to URL-based extraction
      return this.extractFallbackMetadata(originalUrl)
    } catch (error) {
      logger.error('Error extracting video metadata', { originalUrl, error })
      return this.extractFallbackMetadata(originalUrl)
    }
  }

  private isDirectVideoFile(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v']
    const urlPath = new URL(url).pathname.toLowerCase()
    return videoExtensions.some(ext => urlPath.endsWith(ext))
  }

  private extractDirectVideoMetadata(originalUrl: string): VideoMetadata {
    const url = new URL(originalUrl)
    const filename = url.pathname.split('/').pop() || 'video'
    const title = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    
    return {
      title: this.titleCase(title),
      description: `Direct video file: ${filename}`,
      tags: ['video', 'direct-upload'],
      platform: 'direct',
      thumbnail: undefined
    }
  }

  private async extractYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      // Use YouTube oEmbed API for basic metadata
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract tags from title and description using keywords
      const tags = this.extractTagsFromText(`${data.title} ${data.author_name}`)
      
      return {
        title: data.title || `YouTube Video ${videoId}`,
        description: `Video by ${data.author_name}`,
        tags,
        thumbnail: data.thumbnail_url,
      }
    } catch (error) {
      logger.error('Error extracting YouTube metadata', { videoId, error })
      return {
        title: `YouTube Video ${videoId}`,
        description: '',
        tags: ['youtube'],
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    }
  }

  private async extractVimeoMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      // Use Vimeo oEmbed API
      const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`)
      
      if (!response.ok) {
        throw new Error(`Vimeo API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract tags from title and author
      const tags = this.extractTagsFromText(`${data.title} ${data.author_name}`)
      
      return {
        title: data.title || `Vimeo Video ${videoId}`,
        description: data.description || `Video by ${data.author_name}`,
        tags,
        thumbnail: data.thumbnail_url,
        duration: data.duration
      }
    } catch (error) {
      logger.error('Error extracting Vimeo metadata', { videoId, error })
      return {
        title: `Vimeo Video ${videoId}`,
        description: '',
        tags: ['vimeo']
      }
    }
  }

  private async extractTikTokMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      // TikTok doesn't have a public API, so we'll use URL parsing and generic extraction
      const url = `https://www.tiktok.com/@user/video/${videoId}`
      const oEmbedResult = await this.extractOEmbedMetadata(url)
      if (oEmbedResult) {
        return {
          ...oEmbedResult,
          platform: 'tiktok',
          tags: [...(oEmbedResult.tags || []), 'tiktok', 'short-form']
        }
      }
      
      return {
        title: `TikTok Video ${videoId}`,
        description: 'TikTok short-form video content',
        tags: ['tiktok', 'short-form', 'social'],
        platform: 'tiktok'
      }
    } catch (error) {
      logger.error('Error extracting TikTok metadata', { videoId, error })
      return {
        title: `TikTok Video ${videoId}`,
        description: 'TikTok short-form video content',
        tags: ['tiktok', 'short-form'],
        platform: 'tiktok'
      }
    }
  }

  private async extractInstagramMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      // Instagram oEmbed API
      const url = `https://www.instagram.com/p/${videoId}/`
      const response = await fetch(`https://graph.facebook.com/v8.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=your_token`)
      
      // Since we don't have an access token, fall back to URL parsing
      const oEmbedResult = await this.extractOEmbedMetadata(url)
      if (oEmbedResult) {
        return {
          ...oEmbedResult,
          platform: 'instagram',
          tags: [...(oEmbedResult.tags || []), 'instagram', 'social']
        }
      }

      return {
        title: `Instagram Video ${videoId}`,
        description: 'Instagram video content',
        tags: ['instagram', 'social', 'video'],
        platform: 'instagram'
      }
    } catch (error) {
      logger.error('Error extracting Instagram metadata', { videoId, error })
      return {
        title: `Instagram Video ${videoId}`,
        description: 'Instagram video content',
        tags: ['instagram', 'social'],
        platform: 'instagram'
      }
    }
  }

  private async extractTwitterMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      // Twitter oEmbed API
      const url = `https://twitter.com/user/status/${videoId}`
      const response = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`)
      
      if (response.ok) {
        const data = await response.json()
        const tags = this.extractTagsFromText(data.html || '')
        
        return {
          title: data.title || `Twitter Video ${videoId}`,
          description: 'Twitter video content',
          tags: [...tags, 'twitter', 'social'],
          platform: 'twitter'
        }
      }

      return {
        title: `Twitter Video ${videoId}`,
        description: 'Twitter video content',
        tags: ['twitter', 'social', 'video'],
        platform: 'twitter'
      }
    } catch (error) {
      logger.error('Error extracting Twitter metadata', { videoId, error })
      return {
        title: `Twitter Video ${videoId}`,
        description: 'Twitter video content',
        tags: ['twitter', 'social'],
        platform: 'twitter'
      }
    }
  }

  private async extractDailymotionMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      // Dailymotion oEmbed API
      const response = await fetch(`https://www.dailymotion.com/services/oembed?url=https://www.dailymotion.com/video/${videoId}&format=json`)
      
      if (response.ok) {
        const data = await response.json()
        const tags = this.extractTagsFromText(`${data.title} ${data.author_name}`)
        
        return {
          title: data.title || `Dailymotion Video ${videoId}`,
          description: `Video by ${data.author_name}`,
          tags: [...tags, 'dailymotion'],
          thumbnail: data.thumbnail_url,
          platform: 'dailymotion'
        }
      }

      return {
        title: `Dailymotion Video ${videoId}`,
        description: 'Dailymotion video content',
        tags: ['dailymotion', 'video'],
        platform: 'dailymotion'
      }
    } catch (error) {
      logger.error('Error extracting Dailymotion metadata', { videoId, error })
      return {
        title: `Dailymotion Video ${videoId}`,
        description: 'Dailymotion video content',
        tags: ['dailymotion'],
        platform: 'dailymotion'
      }
    }
  }

  private async extractTwitchMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      // Twitch doesn't have public oEmbed, so we'll use generic extraction
      const isClip = videoId.length < 15 // Clips have shorter IDs
      const url = isClip 
        ? `https://clips.twitch.tv/${videoId}`
        : `https://www.twitch.tv/videos/${videoId}`

      return {
        title: isClip ? `Twitch Clip ${videoId}` : `Twitch Video ${videoId}`,
        description: isClip ? 'Twitch gaming clip' : 'Twitch gaming video',
        tags: ['twitch', 'gaming', 'streaming', isClip ? 'clip' : 'vod'],
        platform: 'twitch'
      }
    } catch (error) {
      logger.error('Error extracting Twitch metadata', { videoId, error })
      return {
        title: `Twitch Content ${videoId}`,
        description: 'Twitch gaming content',
        tags: ['twitch', 'gaming'],
        platform: 'twitch'
      }
    }
  }

  private async extractOEmbedMetadata(originalUrl: string): Promise<VideoMetadata | null> {
    try {
      // Try common oEmbed endpoints
      const oEmbedEndpoints = [
        `https://noembed.com/embed?url=${encodeURIComponent(originalUrl)}`,
        `https://iframe.ly/api/oembed?url=${encodeURIComponent(originalUrl)}&api_key=your_key`
      ]

      for (const endpoint of oEmbedEndpoints) {
        try {
          const response = await fetch(endpoint)
          if (response.ok) {
            const data = await response.json()
            if (data.title) {
              const tags = this.extractTagsFromText(`${data.title} ${data.description || ''} ${data.author_name || ''}`)
              
              return {
                title: data.title,
                description: data.description || '',
                tags,
                thumbnail: data.thumbnail_url,
                platform: 'generic'
              }
            }
          }
        } catch (err) {
          // Continue to next endpoint
          continue
        }
      }

      return null
    } catch (error) {
      logger.error('Error extracting oEmbed metadata', { originalUrl, error })
      return null
    }
  }

  private extractFallbackMetadata(originalUrl: string): VideoMetadata {
    // Extract domain and basic info from URL
    try {
      const url = new URL(originalUrl)
      const domain = url.hostname.replace('www.', '')
      const pathSegments = url.pathname.split('/').filter(Boolean)
      
      // Generate a basic title from URL
      const title = pathSegments.length > 0 
        ? this.titleCase(pathSegments[pathSegments.length - 1].replace(/[-_]/g, ' '))
        : `Video from ${domain}`
      
      return {
        title,
        description: `Video from ${domain}`,
        tags: [domain.split('.')[0]]
      }
    } catch (error) {
      return {
        title: 'Uploaded Video',
        description: '',
        tags: ['video']
      }
    }
  }

  private extractTagsFromText(text: string): string[] {
    if (!text) return []

    const commonVideoTags = [
      'music', 'gaming', 'sports', 'news', 'education', 'entertainment',
      'technology', 'science', 'cooking', 'travel', 'fashion', 'fitness',
      'comedy', 'tutorial', 'review', 'unboxing', 'vlog', 'documentary',
      'animation', 'film', 'art', 'design', 'programming', 'business',
      'lifestyle', 'health', 'beauty', 'diy', 'how-to', 'tips', 'guide'
    ]

    const tags: string[] = []
    const lowerText = text.toLowerCase()

    // Check for common video tags in the text
    commonVideoTags.forEach(tag => {
      if (lowerText.includes(tag)) {
        tags.push(tag)
      }
    })

    // Extract hashtags if present
    const hashtagMatches = text.match(/#\w+/g)
    if (hashtagMatches) {
      hashtagMatches.forEach(hashtag => {
        tags.push(hashtag.substring(1).toLowerCase())
      })
    }

    // If no specific tags found, try to categorize based on keywords
    if (tags.length === 0) {
      if (/music|song|album|artist|band|concert/i.test(text)) tags.push('music')
      if (/game|gaming|play|xbox|playstation|nintendo/i.test(text)) tags.push('gaming')
      if (/tutorial|how.?to|guide|learn|lesson/i.test(text)) tags.push('tutorial')
      if (/review|unboxing|test|comparison/i.test(text)) tags.push('review')
      if (/funny|comedy|humor|laugh|joke/i.test(text)) tags.push('comedy')
      if (/food|cooking|recipe|kitchen|chef/i.test(text)) tags.push('cooking')
      if (/tech|technology|software|app|coding|programming/i.test(text)) tags.push('technology')
      if (/news|breaking|update|report/i.test(text)) tags.push('news')
      if (/sport|football|basketball|soccer|tennis/i.test(text)) tags.push('sports')
      if (/travel|vacation|trip|adventure|explore/i.test(text)) tags.push('travel')
    }

    // Ensure we have at least one tag
    if (tags.length === 0) {
      tags.push('video')
    }

    // Remove duplicates and limit to 5 tags
    return Array.from(new Set(tags)).slice(0, 5)
  }

  private titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }
}

export const videoMetadataService = new VideoMetadataService()