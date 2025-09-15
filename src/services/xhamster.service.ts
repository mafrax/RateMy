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

  private isValidContentTag(tag: string): boolean {
    if (!tag || tag.length < 2 || tag.length > 50) return false
    
    // Technical/platform terms to exclude
    const blacklist = [
      // Site/platform names
      'xhamster', 'pornhub', 'redtube', 'tube', 'xvideos', 'youjizz', 'spankbang',
      'chaturbate', 'cam4', 'bongacams', 'stripchat', 'livejasmin', 'flirt4free', 'camsoda',
      'onlyfans', 'manyvids', 'clips4sale', 'iwantclips', 'niteflirt',
      
      // Technical metadata
      'video', 'watch', 'page', 'link', 'site', 'url', 'slug', 'uid', 'id', 'name', 'tags',
      'isbrand', 'ischannel', 'isverified', 'nameen', 'channel', 'channels', 'model', 'models',
      'category', 'categories', 'premium', 'vip', 'verified', 'official',
      
      // Low-level quality/format terms (but allow some descriptive quality terms)
      '720p', '1080p', 'uhd', 'fhd', 'mp4', 'avi', 'wmv', 'flv', 'mov', 'webm',
      'duration', 'length', 'size', 'quality', 'format', 'resolution',
      
      // Social/interaction terms
      'views', 'likes', 'dislikes', 'comments', 'share', 'subscribe', 'follow', 'favorite',
      'bookmark', 'playlist', 'collection', 'gallery', 'abonnement',
      
      // Technical UI/web terms
      'embed', 'iframe', 'player', 'thumb', 'thumbnail', 'preview', 'poster',
      'image', 'img', 'pic', 'photo', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'icon', 'logo', 'banner', 'button', 'click', 'href', 'redirect',
      
      // Advertising/tracking
      'ad', 'ads', 'advertisement', 'promo', 'promotion', 'sponsored', 'affiliate',
      'referrer', 'utm', 'tracking', 'analytics', 'pixel',
      
      // Admin/system terms
      'admin', 'administrator', 'moderator', 'mod', 'user', 'guest', 'member',
      'subscriber', 'account', 'profile', 'settings', 'preferences', 'dashboard',
      'panel', 'control', 'manage', 'edit', 'delete', 'create', 'update',
      
      // General web/tech terms
      'website', 'homepage', 'contact', 'about', 'help', 'faq', 'terms', 'privacy',
      'policy', 'legal', 'dmca', 'copyright', 'trademark', 'disclaimer',
      'search', 'filter', 'sort', 'browse', 'explore', 'discover', 'trending',
      'popular', 'featured', 'recommended', 'related', 'similar', 'more', 'all',
      'new', 'latest', 'recent', 'today', 'week', 'month', 'year', 'date', 'time',
      
      // Meaningless terms
      'content', 'stuff', 'things', 'item', 'object', 'element', 'component',
      'section', 'part', 'piece', 'bit', 'data', 'info', 'information',
      'details', 'description', 'title', 'text', 'caption', 'label',
      
      // UI interaction terms
      'modifier les mots clés', 'edit keywords', 'modifier', 'edit'
    ]
    
    const lowerTag = tag.toLowerCase()
    
    // Check against blacklist
    if (blacklist.includes(lowerTag)) return false
    
    // Skip if contains URLs or technical patterns
    if (lowerTag.includes('http') || lowerTag.includes('www') || lowerTag.includes('.com')) return false
    
    // Skip pure numbers (but allow year tags like 1980s)
    if (/^\d+$/.test(lowerTag) && lowerTag.length < 4) return false
    
    // Skip hex strings (likely IDs)
    if (/^[a-f0-9]{8,}$/i.test(lowerTag)) return false
    
    // Skip technical values
    if (/^(true|false|null|undefined|nan|infinity)$/i.test(lowerTag)) return false
    
    // Skip subscriber counts and numeric social media patterns
    if (/^\d+[km]?$/.test(lowerTag)) return false
    
    return true
  }

  private normalizeTag(tag: string): string {
    if (!tag) return ''
    
    // Convert to lowercase and trim
    let normalized = tag.toLowerCase().trim()
    
    // Remove special characters except hyphens
    normalized = normalized.replace(/[^\w\s-]/g, '')
    
    // Replace spaces and underscores with hyphens
    normalized = normalized.replace(/[\s_]+/g, '-')
    
    // Remove multiple consecutive hyphens
    normalized = normalized.replace(/-+/g, '-')
    
    // Remove leading/trailing hyphens
    normalized = normalized.replace(/^-+|-+$/g, '')
    
    // Tag mappings for common variations including French translations from XHamster
    const tagMappings: Record<string, string> = {
      // English variations
      'big-boobs': 'big-tits',
      'big-breasts': 'big-tits',
      'small-boobs': 'small-tits',
      'small-breasts': 'small-tits',
      'big-butt': 'big-ass',
      'bubble-butt': 'big-ass',
      'small-butt': 'small-ass',
      'black': 'ebony',
      'african': 'ebony',
      'bj': 'blowjob',
      'blow-job': 'blowjob',
      'hj': 'handjob',
      'hand-job': 'handjob',
      'fj': 'footjob',
      'foot-job': 'footjob',
      'pov': 'pov',
      'point-of-view': 'pov',
      'girl-on-girl': 'lesbian',
      'girl-girl': 'lesbian',
      'gg': 'lesbian',
      'boy-boy': 'gay',
      'mm': 'gay',
      'girl-boy': 'straight',
      'milfs': 'milf',
      'moms': 'milf',
      'mothers': 'milf',
      'cougars': 'cougar',
      'grannies': 'granny',
      'grandmas': 'granny',
      'gilf': 'granny',
      
      // French to English mappings (based on your provided HTML)
      'françaises': 'french',
      'francaises': 'french',
      'européennes': 'european',
      'europeennes': 'european',
      'fête': 'party',
      'fete': 'party',
      'fêtes': 'party',
      'fetes': 'party',
      'rétro': 'retro',
      'retro': 'retro',
      'vidéos-hd': 'hd',
      'videos-hd': 'hd',
      'cougar': 'cougar',
      'hardcore': 'hardcore',
      'milf': 'milf',
      'mature': 'mature',
      'vintage': 'vintage',
      'film': 'movie',
      'hardcore-français': 'french-hardcore',
      'hardcore-francais': 'french-hardcore',
      'vintage-des-années-1970': 'vintage-1970s',
      'vintage-des-annees-1970': 'vintage-1970s',
      'classique-français': 'french-classic',
      'classique-francais': 'french-classic',
      'années-80': '1980s',
      'annees-80': '1980s',
      'milf-françaises': 'french-milf',
      'milf-francaises': 'french-milf',
      'hardcore-classique': 'classic-hardcore',
      'milfed': 'milf',
      'hardcore-milfs': 'hardcore-milf',
      'at-the-party': 'party',
      'european-milfs': 'european-milf',
      'before-the-party': 'party',
      'hardcore-party': 'hardcore-party',
      'full-hd': 'hd',
      'my-party': 'party',
      'in-party': 'party',
      'partying': 'party',
      'vintage-classic-full': 'vintage-classic',
      
      // Common variations
      'amateur': 'amateur',
      'blonde': 'blonde',
      'brunette': 'brunette',
      'redhead': 'redhead',
      'teen': 'teen',
      'young': 'teen',
      'old': 'mature',
      'ebony': 'ebony',
      'asian': 'asian',
      'latina': 'latina',
      'bbw': 'bbw',
      'titties': 'tits',
      'boobs': 'tits',
      'breasts': 'tits',
      'sex': 'hardcore',
      'fucking': 'hardcore',
      'parties': 'party',
      '1980s': '1980s',
      '1970s': '1970s'
    }
    
    // Apply mappings
    if (tagMappings[normalized]) {
      normalized = tagMappings[normalized]
    }
    
    return normalized
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

      // Enhanced tags extraction - focus on video-tags-list-container
      const tags = new Set<string>()

      // First, try to extract from the specific video-tags-list-container section
      const videoTagsContainerRegex = /<nav[^>]*id="video-tags-list-container"[^>]*>([\s\S]*?)<\/nav>/i
      const videoTagsContainerMatch = html.match(videoTagsContainerRegex)
      
      if (videoTagsContainerMatch) {
        const containerHtml = videoTagsContainerMatch[1]
        
        // Extract tag text from spans with class "body-8643e label-5984a label-96c3e" or "body-bold-8643e label-5984a label-96c3e"
        // This targets the actual tag labels in the video tags list
        const tagLabelRegex = /<span[^>]*class="[^"]*(?:body-8643e|body-bold-8643e)[^"]*label-5984a[^"]*label-96c3e[^"]*"[^>]*>([^<]+)<\/span>/g
        let tagLabelMatch
        
        while ((tagLabelMatch = tagLabelRegex.exec(containerHtml)) !== null) {
          const tagText = tagLabelMatch[1]?.trim()
          if (tagText && this.isValidContentTag(tagText)) {
            const normalized = this.normalizeTag(tagText)
            if (normalized) {
              tags.add(normalized)
            }
          }
        }
        
        // Also extract from href patterns within the container for categories and tags
        const categoryLinksRegex = /href="[^"]*\/categories\/([^"\/]+)"[^>]*>/g
        let categoryMatch
        while ((categoryMatch = categoryLinksRegex.exec(containerHtml)) !== null) {
          const categorySlug = categoryMatch[1]?.trim()
          if (categorySlug && this.isValidContentTag(categorySlug)) {
            const normalized = this.normalizeTag(categorySlug)
            if (normalized) {
              tags.add(normalized)
            }
          }
        }
        
        const tagLinksRegex = /href="[^"]*\/tags\/([^"\/]+)"[^>]*>/g
        let tagMatch
        while ((tagMatch = tagLinksRegex.exec(containerHtml)) !== null) {
          const tagSlug = tagMatch[1]?.trim()
          if (tagSlug && this.isValidContentTag(tagSlug)) {
            const normalized = this.normalizeTag(tagSlug)
            if (normalized) {
              tags.add(normalized)
            }
          }
        }
      }
      
      // If no tags found from container, fallback to broader extraction
      if (tags.size === 0) {
        // Extract from visible category and tag links in HTML (broader fallback)
        const categoryLinksRegex = /href="[^"]*\/categories\/([^"\/]+)"[^>]*>\s*<[^>]*>\s*<span[^>]*>([^<]+)<\/span>/g
        let categoryMatch
        while ((categoryMatch = categoryLinksRegex.exec(html)) !== null) {
          const categorySlug = categoryMatch[1]?.trim()
          const categoryText = categoryMatch[2]?.trim()
          
          if (categorySlug && this.isValidContentTag(categorySlug)) {
            const normalized = this.normalizeTag(categorySlug)
            if (normalized) tags.add(normalized)
          }
          if (categoryText && categoryText !== categorySlug && this.isValidContentTag(categoryText)) {
            const normalized = this.normalizeTag(categoryText)
            if (normalized) tags.add(normalized)
          }
        }

        const tagLinksRegex = /href="[^"]*\/tags\/([^"\/]+)"[^>]*>\s*<[^>]*>\s*<span[^>]*>([^<]+)<\/span>/g
        let tagMatch
        while ((tagMatch = tagLinksRegex.exec(html)) !== null) {
          const tagSlug = tagMatch[1]?.trim()
          const tagText = tagMatch[2]?.trim()
          
          if (tagSlug && this.isValidContentTag(tagSlug)) {
            const normalized = this.normalizeTag(tagSlug)
            if (normalized) tags.add(normalized)
          }
          if (tagText && tagText !== tagSlug && this.isValidContentTag(tagText)) {
            const normalized = this.normalizeTag(tagText)
            if (normalized) tags.add(normalized)
          }
        }
      }

      // Convert Set to Array and apply tag normalization
      let finalTags = Array.from(tags)
      
      // Normalize and clean up tags
      finalTags = finalTags
        .map(tag => this.normalizeTag(tag))
        .filter(tag => tag && tag.length >= 2 && tag.length <= 50) // Increased limit for longer compound tags
        .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
        .sort() // Sort alphabetically for consistent output

      metadata.tags = finalTags.length > 0 ? finalTags : undefined

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