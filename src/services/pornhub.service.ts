import { logger } from '@/src/lib/logger'

export interface PornhubMetadata {
  title: string
  description?: string
  tags: string[]
  thumbnail?: string
}

export interface PornhubProcessResult {
  metadata: PornhubMetadata
  tags: string[]
  thumbnail?: string
  previewUrl?: string
  embedUrl: string
}

class PornhubService {
  isUrl(url: string): boolean {
    return (url.includes('pornhub.com') || url.includes('pornhub.org')) && url.includes('view_video.php?viewkey=')
  }

  extractVideoId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:[\w]+\.)?pornhub\.(?:com|org)\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  private async trySearch(searchQuery: string, videoId: string, domain: string): Promise<string | null> {
    try {
      const encodedQuery = encodeURIComponent(searchQuery)
      const searchUrl = `${domain}/video/search?search=${encodedQuery}`
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        return null
      }

      const searchHtml = await response.text()
      
      // Look for our specific video in search results by matching the viewkey
      const videoLinkPattern = new RegExp(`/view_video\\.php\\?viewkey=${videoId}`, 'gi')
      const hasOurVideo = searchHtml.match(videoLinkPattern)
      
      if (!hasOurVideo) {
        console.log('❌ Video not found in search results for query:', searchQuery)
        return null
      }
      
      console.log('✅ Video found in search results')

      // Try flexible patterns to find preview URL
      const flexiblePatterns = [
        new RegExp(`viewkey=${videoId}[\\s\\S]{0,2000}?data-mediabook="([^"]*)"`, 'gi'),
        new RegExp(`data-mediabook="([^"]*)"[\\s\\S]{0,2000}?viewkey=${videoId}`, 'gi'),
        new RegExp(`viewkey=${videoId}[\\s\\S]{0,5000}?data-mediabook="([^"]*)"`, 'gi'),
        new RegExp(`data-mediabook="([^"]*)"[\\s\\S]{0,5000}?viewkey=${videoId}`, 'gi')
      ]

      for (let i = 0; i < flexiblePatterns.length; i++) {
        const pattern = flexiblePatterns[i]
        let match = pattern.exec(searchHtml)
        
        if (match) {
          const previewUrl = match[1].replace(/&amp;/g, '&')
          console.log('Found preview URL:', previewUrl)
          return previewUrl
        }
      }

      // Proximity search as fallback
      const htmlParts = searchHtml.split(`viewkey=${videoId}`)
      if (htmlParts.length > 1) {
        for (let i = 1; i < htmlParts.length; i++) {
          const beforeViewkey = htmlParts[i - 1].slice(-3000)
          const afterViewkey = htmlParts[i].slice(0, 3000)
          const surroundingText = beforeViewkey + `viewkey=${videoId}` + afterViewkey
          
          const mediabookMatch = surroundingText.match(/data-mediabook="([^"]*)"/i)
          if (mediabookMatch) {
            const previewUrl = mediabookMatch[1].replace(/&amp;/g, '&')
            return previewUrl
          }
        }
      }

      return null

    } catch (error) {
      return null
    }
  }

  private async searchBasedPreviewExtraction(title: string, videoId: string, originalUrl: string, uploader?: string | null): Promise<string | null> {
    try {
      // Extract the domain/language from the original URL to match the search domain
      const urlMatch = originalUrl.match(/https?:\/\/([^.]+\.)?(pornhub\.(?:com|org))/)
      const domain = urlMatch ? urlMatch[0].replace(/\/$/, '') : 'https://www.pornhub.com'
      
      // Clean the title for search - remove problematic characters and HTML entities
      const cleanTitle = title
        .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities like &#124;
        .replace(/[|<>{}[\]\\-]/g, ' ') // Remove problematic characters including hyphens
        .replace(/[^\w\sáéíóúñüç]/g, ' ') // Keep only alphanumeric, spaces, and common Spanish chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
        .toLowerCase() // Use lowercase for better search results
      
      // Try search with just the title first
      let searchResult = await this.trySearch(cleanTitle, videoId, domain)
      
      // If that fails and we have an uploader, try with uploader added
      if (!searchResult && uploader) {
        const titleWithUploader = `${cleanTitle} ${uploader.toLowerCase()}`
        searchResult = await this.trySearch(titleWithUploader, videoId, domain)
      }
      
      return searchResult

    } catch (error) {
      logger.error('Error in search-based preview extraction', {
        videoId,
        title,
        error: error instanceof Error ? error.message : error
      })
      return null
    }
  }

  async processUrl(url: string): Promise<PornhubProcessResult> {
    const videoId = this.extractVideoId(url)
    if (!videoId) {
      throw new Error('Invalid Pornhub URL format')
    }

    console.log('\n=== PORNHUB PROCESSING ===')
    console.log('URL:', url)
    console.log('Video ID:', videoId)
    
    logger.info('Processing Pornhub URL', { url, videoId })

    try {
      // Generate embed URL - always use www.pornhub.com for embeds to avoid X-Frame-Options issues
      // Localized domains (fr.pornhub.org, etc.) often have stricter embedding policies
      const embedUrl = `https://www.pornhub.com/embed/${videoId}`
      
      // Initialize metadata
      const metadata: PornhubMetadata = {
        title: `Pornhub Video ${videoId}`,
        description: '',
        tags: ['adult', 'pornhub']
      }

      let thumbnail: string | undefined
      let previewUrl: string | undefined

      // Try to fetch the page and extract metadata
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })

        if (response.ok) {
          const html = await response.text()
          console.log('Page fetched successfully, length:', html.length)
          
          // Extract title from meta tags or page title
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                            html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                            html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"[^>]*>/i)
          if (titleMatch) {
            metadata.title = titleMatch[1].trim().replace(/ - Pornhub\.com$/, '')
            console.log('Extracted title:', metadata.title)
          } else {
            console.log('❌ No title found in page')
          }

          // Extract description
          const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i) ||
                           html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
          if (descMatch) {
            metadata.description = descMatch[1].trim()
          }

          // Extract thumbnail from og:image
          const thumbMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)
          if (thumbMatch) {
            thumbnail = thumbMatch[1]
          }

          // Extract uploader information for enhanced search
          let uploader: string | null = null
          const uploaderPatterns = [
            /data-username="([^"]+)"/i,
            /"username":"([^"]+)"/i,
            /\/users\/([^"\/\s]+)/i,
            /\/model\/([^"\/\s]+)/i,
            /"channel":"([^"]+)"/i,
            /"uploader":"([^"]+)"/i
          ]
          
          for (const pattern of uploaderPatterns) {
            const match = html.match(pattern)
            if (match) {
              uploader = match[1]
              logger.info('Found uploader for enhanced search', { videoId, uploader })
              break
            }
          }

          // Try search-based approach for preview
          if (!previewUrl && metadata.title) {
            console.log('🔍 Searching for preview using title:', metadata.title)
            const fallbackPreview = await this.searchBasedPreviewExtraction(metadata.title, videoId, url, uploader)
            if (fallbackPreview) {
              previewUrl = fallbackPreview
              console.log('✅ Preview found:', fallbackPreview)
            } else {
              console.log('❌ No preview found via search')
            }
          }

          // Extract tags
          const tags = new Set<string>(['adult', 'pornhub', 'nsfw'])

          // Extract pornstars
          const pornstarMatches = html.match(/<a[^>]*class="[^"]*pstar-list-btn[^"]*"[^>]*href="\/pornstar\/([^"]+)"[^>]*>[\s\S]*?([^<]+)<\/a>/gi) || []
          pornstarMatches.forEach(match => {
            const nameMatch = match.match(/>([^<]+)(?=\s*<span|$)/i)
            if (nameMatch) {
              const name = nameMatch[1].trim()
              if (name && !name.includes('psbox-link-container')) {
                tags.add(name.toLowerCase())
              }
            }
          })

          // Extract categories
          const categoryMatches = html.match(/<a[^>]*class="[^"]*item[^"]*"[^>]*data-label="category"[^>]*>([^<]+)<\/a>/gi) || []
          categoryMatches.forEach(match => {
            const nameMatch = match.match(/>([^<]+)<\/a>/i)
            if (nameMatch) {
              tags.add(nameMatch[1].trim().toLowerCase())
            }
          })

          // Extract tags
          const tagMatches = html.match(/<a[^>]*data-label="tag"[^>]*><span>([^<]+)<\/span><\/a>/gi) || []
          tagMatches.forEach(match => {
            const nameMatch = match.match(/<span>([^<]+)<\/span>/i)
            if (nameMatch) {
              tags.add(nameMatch[1].trim().toLowerCase())
            }
          })

          metadata.tags = Array.from(tags)
        }
      } catch (fetchError) {
        logger.warn('Could not fetch Pornhub page for metadata, using defaults', { 
          error: fetchError instanceof Error ? fetchError.message : fetchError 
        })
      }

      logger.info('Pornhub metadata processed', {
        videoId,
        embedUrl,
        hasTitle: !!metadata.title,
        hasThumbnail: !!thumbnail,
        hasPreview: !!previewUrl,
        previewUrl: previewUrl,
        tagsCount: metadata.tags?.length || 0
      })

      return {
        metadata,
        tags: metadata.tags || ['adult', 'pornhub', 'nsfw'],
        thumbnail,
        previewUrl,
        embedUrl
      }

    } catch (error) {
      logger.error('Error processing Pornhub URL', { error, url, videoId })
      throw new Error(`Failed to process Pornhub video: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const pornhubService = new PornhubService()