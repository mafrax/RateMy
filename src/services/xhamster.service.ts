import { logger } from '@/src/lib/logger'

export interface XHamsterMetadata {
  title?: string
  description?: string
  thumbnail?: string
  previewUrl?: string
  tags?: string[]
}

export class XHamsterServiceImpl {
  isXHamsterUrl(url: string): boolean {
    return url.includes('xhamster.com')
  }

  async processXHamsterUrl(originalUrl: string): Promise<XHamsterMetadata> {
    try {
      logger.info('Processing XHamster URL for metadata extraction', { url: originalUrl })

      // Fetch the HTML page
      const response = await fetch(originalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch XHamster page: ${response.status}`)
      }

      const html = await response.text()

      // Extract metadata from various sources
      const metadata: XHamsterMetadata = {}

      // Extract title from meta tags or page title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                        html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                        html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"[^>]*>/i)
      if (titleMatch) {
        metadata.title = titleMatch[1].trim()
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
        metadata.thumbnail = thumbMatch[1] // Use the captured group from og:image
      } else {
        // Fallback: search for direct image URLs
        const directImageMatch = html.match(/https:\/\/ic-vt-[^"]*\.xhpingcdn\.com\/[^"]*\.jpg/g) ||
                                html.match(/https:\/\/thumb-[^"]*\.xhpingcdn\.com\/[^"]*\.jpg/g)
        if (directImageMatch) {
          metadata.thumbnail = Array.isArray(directImageMatch) ? directImageMatch[0] : directImageMatch
        }
      }

      // Extract preview URL from initials-script
      const scriptPatterns = [
        /<script id="initials-script"[^>]*>([\s\S]*?)<\/script>/i,
        /<script[^>]*id="initials-script"[^>]*>([\s\S]*?)<\/script>/i,
        /<script[^>]*initials[^>]*>([\s\S]*?)<\/script>/i
      ]
      
      let scriptContent = null
      
      for (const pattern of scriptPatterns) {
        const match = html.match(pattern)
        if (match) {
          scriptContent = match[1]
          break
        }
      }
      
      if (scriptContent) {
        // Look for trailerURL in the script (more flexible regex)
        const patterns = [
          /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.t\.mp4[^"]*)"/gi,
          /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.mp4[^"]*)"/gi,
          /"trailerURL"\s*:\s*"([^"]*\.mp4[^"]*)"/gi
        ]
        
        for (const pattern of patterns) {
          const matches = scriptContent.match(pattern)
          if (matches && matches.length > 0) {
            // Get the first match and extract URL from capture group
            const firstMatch = matches[0].match(/"trailerURL"\s*:\s*"([^"]*)"/i)
            if (firstMatch) {
              metadata.previewUrl = firstMatch[1].replace(/\\\//g, '/')
              break
            }
          }
        }
      } else {
        // Fallback: search the entire HTML for trailerURL
        const patterns = [
          /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.t\.mp4[^"]*)"/gi,
          /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.mp4[^"]*)"/gi,
          /"trailerURL"\s*:\s*"([^"]*\.mp4[^"]*)"/gi
        ]
        
        for (const pattern of patterns) {
          const matches = html.match(pattern)
          if (matches && matches.length > 0) {
            const firstMatch = matches[0].match(/"trailerURL"\s*:\s*"([^"]*)"/i)
            if (firstMatch) {
              metadata.previewUrl = firstMatch[1].replace(/\\\//g, '/')
              break
            }
          }
        }
      }

      // Extract basic tags from keywords or categories if available
      const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"[^>]*>/i)
      if (keywordsMatch) {
        metadata.tags = keywordsMatch[1].split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
      }

      logger.info('XHamster metadata extracted', {
        url: originalUrl,
        hasTitle: !!metadata.title,
        hasDescription: !!metadata.description,
        hasThumbnail: !!metadata.thumbnail,
        hasPreviewUrl: !!metadata.previewUrl,
        tagsCount: metadata.tags?.length || 0
      })

      return metadata

    } catch (error) {
      logger.error('Failed to process XHamster URL', { 
        url: originalUrl, 
        error: error instanceof Error ? error.message : error 
      })
      throw error
    }
  }
}

export const xHamsterService = new XHamsterServiceImpl()