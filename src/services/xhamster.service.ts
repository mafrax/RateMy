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
    
    // Tag mappings for common variations including French translations
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
      'gf': 'girlfriend',
      'bf': 'boyfriend',
      'hubby': 'husband',
      'wifey': 'wife',
      'teen18': 'teen',
      'teen-18': 'teen',
      'eighteen': 'teen',
      '18yo': 'teen',
      '18-year-old': 'teen',
      '18-ans': 'teen',
      'milfs': 'milf',
      'moms': 'milf',
      'mothers': 'milf',
      'cougars': 'milf',
      'grannies': 'granny',
      'grandmas': 'granny',
      'gilf': 'granny',
      // French to English mappings
      'bombasse': 'babe',
      'jeune': 'teen',
      'pipe': 'blowjob',
      'blonde': 'blonde',
      'petits-seins': 'small-tits',
      'grosse-bite': 'big-cock',
      'big-cock': 'big-cock',
      'massive-cock': 'big-cock',
      'enormous': 'big-cock',
      'irrumation': 'face-fuck',
      'face-fuck': 'deepthroat',
      'sexe-brutal': 'rough-sex',
      'rough-sex': 'rough-sex',
      'videos-hd': 'hd',
      'vidéos-hd': 'hd',
      'amateur': 'amateur',
      'excitee': 'horny',
      'excitée': 'horny',
      'horny': 'horny',
      'adolescents': 'teen',
      'doigtage-de-chatte': 'fingering',
      'fingering-pussy': 'fingering',
      'doigtee': 'fingered',
      'fingered': 'fingering',
      'beautes': 'babe',
      'beautés': 'babe',
      'gemissements-bruyants': 'moaning',
      'loud-moaning': 'moaning',
      'petite-chatte': 'small-pussy',
      'little-pussy': 'small-pussy',
      'jouet': 'toys',
      'toy': 'toys',
      'seins-naturels': 'natural-tits',
      'natural-boobs': 'natural-tits',
      'natural-tits': 'natural-tits',
      'utilise-moi': 'freeuse',
      'use-me': 'freeuse',
      'utilisation-gratuite': 'freeuse',
      'ascenseur': 'elevator',
      'bande-annonce': 'trailer',
      'etourdissant': 'stunning',
      'stunner': 'stunning',
      'arracher': 'rough',
      'snatch': 'rough',
      'banging': 'hardcore',
      'beginner': 'amateur',
      'titties': 'tits',
      'my-little': 'petite',
      'trap': 'stuck',
      'tights': 'pantyhose',
      'fingers': 'fingering',
      'pounds': 'pounding',
      'sex': 'hardcore'
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

      // Enhanced tags extraction from multiple sources
      const tags = new Set<string>()

      // 1. Extract from keywords meta tag
      const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"[^>]*>/i)
      if (keywordsMatch) {
        keywordsMatch[1].split(',').forEach(tag => {
          const cleanTag = tag.trim().toLowerCase()
          if (cleanTag && cleanTag.length > 2) {
            tags.add(cleanTag)
          }
        })
      }

      // 2. Extract from visible category and tag links in HTML (more reliable approach)
      // Extract category links like: href="https://fra.xhamster.com/categories/teen"
      const categoryLinksRegex = /href="[^"]*\/categories\/([^"]+)"[^>]*>\s*<[^>]*>\s*([^<]+)</g
      let categoryMatch
      while ((categoryMatch = categoryLinksRegex.exec(html)) !== null) {
        const categorySlug = categoryMatch[1]?.trim()
        const categoryText = categoryMatch[2]?.trim()
        
        if (categorySlug && categorySlug.length > 1) {
          tags.add(categorySlug.toLowerCase())
        }
        if (categoryText && categoryText.length > 2 && categoryText !== categorySlug) {
          // Also add the display text if it's different
          const normalized = this.normalizeTag(categoryText)
          if (normalized) tags.add(normalized)
        }
      }

      // Extract tag links like: href="https://fra.xhamster.com/tags/freeuse"
      const tagLinksRegex = /href="[^"]*\/tags\/([^"]+)"[^>]*>\s*<[^>]*>\s*([^<]+)</g
      let tagMatch
      while ((tagMatch = tagLinksRegex.exec(html)) !== null) {
        const tagSlug = tagMatch[1]?.trim()
        const tagText = tagMatch[2]?.trim()
        
        if (tagSlug && tagSlug.length > 1) {
          tags.add(tagSlug.toLowerCase())
        }
        if (tagText && tagText.length > 2 && tagText !== tagSlug) {
          const normalized = this.normalizeTag(tagText)
          if (normalized) tags.add(normalized)
        }
      }

      // 3. Extract channel/pornstar names from links
      const pornstarLinksRegex = /href="[^"]*\/pornstars\/([^"]+)"[^>]*>[\s\S]*?alt="([^"]*)"[^>]*>/g
      let pornstarMatch
      while ((pornstarMatch = pornstarLinksRegex.exec(html)) !== null) {
        const pornstarName = pornstarMatch[2]?.trim()
        
        if (pornstarName && pornstarName.length > 2) {
          const normalized = this.normalizeTag(pornstarName)
          if (normalized && normalized !== 'image' && normalized !== 'avatar') {
            tags.add(normalized)
          }
        }
      }

      // 4. Extract from JSON data (more targeted approach)
      if (scriptContent) {
        try {
          // Look for specific tag arrays that contain actual content tags
          const tagArrayPattern = /"tags"\s*:\s*\[([^\]]*"[^"]*"[^\]]*)\]/g
          const tagArrayMatches = scriptContent.match(tagArrayPattern)
          
          if (tagArrayMatches) {
            tagArrayMatches.forEach(match => {
              const tagStringArray = match.match(/"([^"]{2,30})"/g)
              if (tagStringArray) {
                tagStringArray.forEach(tagStr => {
                  const tag = tagStr.replace(/"/g, '').trim()
                  // Only add tags that look like real content tags, not technical fields
                  if (tag && 
                      tag.length >= 2 && 
                      tag.length <= 30 &&
                      !tag.includes('http') &&
                      !tag.includes('www') &&
                      !tag.includes('.com') &&
                      !tag.match(/^(id|url|slug|uid|name|tags|isbrand|ischannel|isverified|nameen)$/i) &&
                      !tag.match(/^\d+$/) // Skip pure numbers
                  ) {
                    const normalized = this.normalizeTag(tag)
                    if (normalized) tags.add(normalized)
                  }
                })
              }
            })
          }

          // Look for category objects with names
          const categoryPattern = /"categories"\s*:\s*\[[^\]]*"name"\s*:\s*"([^"]+)"[^\]]*\]/g
          const categoryMatches = scriptContent.match(categoryPattern)
          if (categoryMatches) {
            categoryMatches.forEach(match => {
              const nameMatch = match.match(/"name"\s*:\s*"([^"]+)"/g)
              if (nameMatch) {
                nameMatch.forEach(name => {
                  const categoryName = name.match(/"name"\s*:\s*"([^"]+)"/)?.[1]
                  if (categoryName && categoryName.length > 2) {
                    const normalized = this.normalizeTag(categoryName)
                    if (normalized) tags.add(normalized)
                  }
                })
              }
            })
          }
        } catch (error) {
          logger.warn('Error parsing JSON content for tags', { error })
        }
      }

      // 5. Extract from video-specific metadata patterns and other HTML elements
      const videoTagsPattern = /<span[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/span>/gi
      let videoTagMatch
      while ((videoTagMatch = videoTagsPattern.exec(html)) !== null) {
        const tagName = videoTagMatch[1].trim()
        if (tagName && tagName.length > 2) {
          const normalized = this.normalizeTag(tagName)
          if (normalized) tags.add(normalized)
        }
      }

      // 6. Extract quality indicators and content type from title/description
      const titleLower = (metadata.title || '').toLowerCase()
      const descLower = (metadata.description || '').toLowerCase()
      const combinedText = `${titleLower} ${descLower}`

      // Quality tags
      if (combinedText.includes('4k') || combinedText.includes('ultra hd')) tags.add('4k')
      if (combinedText.includes('hd') && !tags.has('4k')) tags.add('hd')
      if (combinedText.includes('60fps')) tags.add('60fps')
      if (combinedText.includes('vr')) tags.add('vr')

      // Content type tags
      if (combinedText.includes('amateur')) tags.add('amateur')
      if (combinedText.includes('professional')) tags.add('professional')
      if (combinedText.includes('webcam')) tags.add('webcam')
      if (combinedText.includes('homemade')) tags.add('homemade')
      
      // Activity tags (common ones)
      const activityTags = [
        'solo', 'couple', 'threesome', 'group', 'lesbian', 'gay', 'straight',
        'anal', 'oral', 'masturbation', 'blowjob', 'handjob', 'footjob',
        'massage', 'stripteasing', 'dancing', 'shower', 'bath', 'outdoor',
        'public', 'car', 'office', 'bedroom', 'kitchen', 'bathroom'
      ]
      
      activityTags.forEach(activityTag => {
        if (combinedText.includes(activityTag)) {
          tags.add(activityTag)
        }
      })

      // Demographic tags
      const demographicTags = [
        'teen', 'milf', 'mature', 'granny', 'young', 'old',
        'blonde', 'brunette', 'redhead', 'black hair', 'asian', 'latina',
        'ebony', 'white', 'bbw', 'thin', 'curvy', 'big tits', 'small tits',
        'big ass', 'small ass', 'tattoo', 'piercing', 'hairy', 'shaved'
      ]
      
      demographicTags.forEach(demoTag => {
        if (combinedText.includes(demoTag)) {
          tags.add(demoTag.replace(' ', '-'))
        }
      })

      // Convert Set to Array and apply tag normalization
      let finalTags = Array.from(tags)
      
      // Normalize and clean up tags
      finalTags = finalTags
        .map(tag => this.normalizeTag(tag))
        .filter(tag => tag && tag.length >= 2 && tag.length <= 30)
        .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
        .slice(0, 15) // Limit to 15 tags max

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