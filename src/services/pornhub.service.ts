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
    return url.includes('pornhub.com') && url.includes('view_video.php?viewkey=')
  }

  extractVideoId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:[\w]+\.)?pornhub\.com\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  private async trySearch(searchQuery: string, videoId: string, domain: string): Promise<string | null> {
    try {
      const encodedQuery = encodeURIComponent(searchQuery)
      const searchUrl = `${domain}/video/search?search=${encodedQuery}`
      
      console.log('Search URL:', searchUrl)
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        console.warn('Search request failed:', response.status, response.statusText)
        return null
      }

      const searchHtml = await response.text()
      
      // Look for our specific video in search results by matching the viewkey
      const videoLinkPattern = new RegExp(`/view_video\\.php\\?viewkey=${videoId}`, 'gi')
      const hasOurVideo = searchHtml.match(videoLinkPattern)
      
      if (!hasOurVideo) {
        console.warn('Our video not found in search results')
        return null
      }

      console.log('Found our video in search results')

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
          console.log('SUCCESS: Found preview via flexible pattern', i + 1)
          console.log('Preview URL:', previewUrl)
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
            console.log('SUCCESS: Found preview via proximity search')
            console.log('Preview URL:', previewUrl)
            return previewUrl
          }
        }
      }

      console.warn('Could not extract preview from search results')
      return null

    } catch (error) {
      console.error('Error in search attempt:', error instanceof Error ? error.message : error)
      return null
    }
  }

  private async searchBasedPreviewExtraction(title: string, videoId: string, originalUrl: string, uploader?: string | null): Promise<string | null> {
    try {
      console.log('\n=== SEARCH-BASED PREVIEW EXTRACTION ===')
      console.log('Title:', title)
      console.log('Video ID:', videoId)
      console.log('Original URL:', originalUrl)
      console.log('Uploader:', uploader || 'none')
      
      // Extract the domain/language from the original URL to match the search domain
      const urlMatch = originalUrl.match(/https?:\/\/([^.]+\.)?(pornhub\.com)/)
      const domain = urlMatch ? urlMatch[0].replace(/\/$/, '') : 'https://www.pornhub.com'
      
      // Clean the title for search - remove problematic characters and HTML entities
      const cleanTitle = title
        .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities like &#124;
        .replace(/[|<>{}[\]\\-]/g, ' ') // Remove problematic characters including hyphens
        .replace(/[^\w\sáéíóúñüç]/g, ' ') // Keep only alphanumeric, spaces, and common Spanish chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
        .toLowerCase() // Use lowercase for better search results
      
      console.log('Cleaned title for search:', cleanTitle)
      
      // Try search with just the title first
      let searchResult = await this.trySearch(cleanTitle, videoId, domain)
      
      // If that fails and we have an uploader, try with uploader added
      if (!searchResult && uploader) {
        console.log('Basic search failed, trying with uploader:', uploader)
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

    logger.info('Processing Pornhub URL', { url, videoId })

    try {
      // Generate embed URL
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

          // Extract title from meta tags or page title
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                            html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                            html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"[^>]*>/i)
          if (titleMatch) {
            metadata.title = titleMatch[1].trim().replace(/ - Pornhub\.com$/, '')
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

          // DISABLE ALL direct extraction - force search-based fallback only
          logger.info('SKIPPING ALL direct preview extraction to force search-based fallback', {
            videoId,
            reason: 'direct-extraction-unreliable'
          })
          
          // DISABLE title-based matching from direct page - it's picking wrong previews
          // Force search-based fallback to be used instead for accuracy
          if (false && metadata.title) {
            // Create a simplified title for matching (remove common suffixes and normalize)
            const normalizedTitle = metadata.title
              .replace(/ - Pornhub\.com$/, '')
              .replace(/[^\w\s]/g, '')
              .toLowerCase()
              .trim()

            // Look for img elements with data-title and data-mediabook
            // We need to handle cases where the attributes might be in different orders
            const allDataMediabookMatches = html.match(/data-mediabook="([^"]*)"/gi) || []
            const allDataTitleMatches = html.match(/data-title="([^"]*)"/gi) || []
            
            logger.info('Found data-mediabook and data-title matches', {
              videoId,
              mediabookCount: allDataMediabookMatches.length,
              titleCount: allDataTitleMatches.length,
              searchingFor: metadata.title
            })

            // Try multiple regex patterns to find title-mediabook pairs
            const titleMediabookPatterns = [
              // Pattern 1: data-title followed by data-mediabook
              /data-title="([^"]*)"[^>]*data-mediabook="([^"]*)"/gi,
              // Pattern 2: data-mediabook followed by data-title  
              /data-mediabook="([^"]*)"[^>]*data-title="([^"]*)"/gi,
              // Pattern 3: Both attributes in the same img tag (any order)
              /<img[^>]*data-title="([^"]*)"[^>]*data-mediabook="([^"]*)"[^>]*>/gi,
              /<img[^>]*data-mediabook="([^"]*)"[^>]*data-title="([^"]*)"[^>]*>/gi
            ]

            for (const pattern of titleMediabookPatterns) {
              let titleMatch
              while ((titleMatch = pattern.exec(html)) !== null) {
                let dataTitle, mediabookUrl
                
                // Handle different capture group orders based on pattern
                if (pattern.toString().includes('data-title.*data-mediabook')) {
                  dataTitle = titleMatch[1]
                  mediabookUrl = titleMatch[2]
                } else {
                  mediabookUrl = titleMatch[1]
                  dataTitle = titleMatch[2]
                }
                
                // Normalize both titles for comparison
                const normalizedDataTitle = dataTitle
                  .replace(/[^\w\s]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .toLowerCase()
                  .trim()

                const normalizedSearchTitle = normalizedTitle
                  .replace(/[^\w\s]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .toLowerCase()
                  .trim()

                logger.info('Comparing titles', {
                  videoId,
                  searchTitle: normalizedSearchTitle,
                  foundTitle: normalizedDataTitle,
                  originalFound: dataTitle,
                  mediabookUrl: mediabookUrl.substring(0, 100) + '...'
                })

                // Check if titles match (exact, partial, or word overlap)
                if (normalizedSearchTitle && normalizedDataTitle) {
                  const isExactMatch = normalizedSearchTitle === normalizedDataTitle
                  const isPartialMatch = normalizedSearchTitle.includes(normalizedDataTitle) || 
                                        normalizedDataTitle.includes(normalizedSearchTitle)
                  
                  // Check for word overlap (at least 2 words in common)
                  const searchWords = normalizedSearchTitle.split(' ').filter((w: string) => w.length > 2)
                  const dataWords = normalizedDataTitle.split(' ').filter((w: string) => w.length > 2)
                  const commonWords = searchWords.filter(word => dataWords.includes(word))
                  const hasWordOverlap = commonWords.length >= 2

                  if (isExactMatch || isPartialMatch || hasWordOverlap) {
                    previewUrl = mediabookUrl.replace(/&amp;/g, '&')
                    logger.info('Found matching preview by title', {
                      videoId,
                      originalTitle: metadata.title,
                      matchedTitle: dataTitle,
                      matchType: isExactMatch ? 'exact' : (isPartialMatch ? 'partial' : 'word-overlap'),
                      commonWords,
                      previewUrl
                    })
                    break
                  }
                }
              }
              if (previewUrl) break
            }
          }

          // DISABLE the broad patterns that might pick wrong previews
          // Force the system to rely on search-based fallback for accuracy
          if (!previewUrl && videoId) {
            logger.info('SKIPPING broad pattern matching to avoid wrong previews', {
              videoId,
              searchTitle: metadata.title,
              reason: 'forcing-search-based-fallback-for-accuracy'
            })
          }

          // Skip internal ID and URL analysis - rely on search fallback
          logger.info('Skipping internal URL analysis to force search-based fallback', {
            videoId,
            reason: 'avoid-wrong-preview-selection'
          })

          // DISABLE additional fallback patterns - force search-based only
          logger.info('SKIPPING additional fallback patterns to force search-based approach', {
            videoId,
            reason: 'avoid-wrong-preview-selection'
          })

          // Log current state before fallback
          logger.info('Preview extraction status before fallback', {
            videoId,
            hasPreview: !!previewUrl,
            currentPreview: previewUrl,
            title: metadata.title,
            willTryFallback: !previewUrl && !!metadata.title
          })

          // If still no preview found, try search-based approach as fallback
          if (!previewUrl && metadata.title) {
            logger.info('STARTING search-based fallback for preview extraction', {
              videoId,
              title: metadata.title,
              originalUrl: url,
              hasUploader: !!uploader
            })
            
            const fallbackPreview = await this.searchBasedPreviewExtraction(metadata.title, videoId, url, uploader)
            if (fallbackPreview) {
              previewUrl = fallbackPreview
              logger.info('SUCCESS: Search-based fallback found preview', {
                videoId,
                previewUrl,
                method: 'search-fallback'
              })
            } else {
              logger.warn('FAILED: Search-based fallback could not find preview', {
                videoId,
                title: metadata.title,
                uploader
              })
            }
          } else if (previewUrl) {
            logger.info('Using preview from direct extraction (no fallback needed)', {
              videoId,
              previewUrl,
              method: 'direct-extraction'
            })
          }

          // If still no preview found after all attempts, log for debugging
          if (!previewUrl) {
            logger.error('FINAL RESULT: No preview URL found for Pornhub video after all attempts', {
              videoId,
              hasTitle: !!metadata.title,
              title: metadata.title,
              url: url
            })
          } else {
            logger.info('FINAL RESULT: Preview URL successfully extracted', {
              videoId,
              previewUrl,
              title: metadata.title
            })
          }

          // Enhanced tag extraction from the video-detailed-info section
          const tags = new Set<string>(['adult', 'pornhub', 'nsfw'])

          // Extract pornstars from the pornstarsWrapper section
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

          // Extract categories from the categoriesWrapper section
          const categoryMatches = html.match(/<a[^>]*class="[^"]*item[^"]*"[^>]*data-label="category"[^>]*>([^<]+)<\/a>/gi) || []
          categoryMatches.forEach(match => {
            const nameMatch = match.match(/>([^<]+)<\/a>/i)
            if (nameMatch) {
              tags.add(nameMatch[1].trim().toLowerCase())
            }
          })

          // Extract tags from the tagsWrapper section
          const tagMatches = html.match(/<a[^>]*data-label="tag"[^>]*><span>([^<]+)<\/span><\/a>/gi) || []
          tagMatches.forEach(match => {
            const nameMatch = match.match(/<span>([^<]+)<\/span>/i)
            if (nameMatch) {
              tags.add(nameMatch[1].trim().toLowerCase())
            }
          })

          // Extract model attributes from relatedSearchTermsContainer
          const modelMatches = html.match(/<a[^>]*data-label="model_attributes"[^>]*>([^<]+)<\/a>/gi) || []
          modelMatches.forEach(match => {
            const nameMatch = match.match(/>([^<]+)<\/a>/i)
            if (nameMatch) {
              tags.add(nameMatch[1].trim().toLowerCase())
            }
          })

          // Extract production type
          const productionMatch = html.match(/<a[^>]*data-label="production"[^>]*>([^<]+)<\/a>/i)
          if (productionMatch) {
            tags.add(productionMatch[1].trim().toLowerCase())
          }

          // Fallback: Look for category and tag information in URLs (old method)
          const fallbackCategoryMatches = html.match(/\/categories\/([^"\/\s]+)/g) || []
          const fallbackTagMatches = html.match(/\/tags\/([^"\/\s]+)/g) || []

          fallbackCategoryMatches.forEach(match => {
            const category = match.replace('/categories/', '').trim()
            if (category && category.length > 1) {
              tags.add(category.toLowerCase())
            }
          })

          fallbackTagMatches.forEach(match => {
            const tag = match.replace('/tags/', '').trim()
            if (tag && tag.length > 1) {
              tags.add(tag.toLowerCase())
            }
          })

          metadata.tags = Array.from(tags)
          
          logger.info('Enhanced tag extraction completed', {
            videoId,
            tagsFound: metadata.tags.length,
            tags: metadata.tags.slice(0, 10) // Log first 10 tags for debugging
          })
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
        previewUrl: previewUrl, // Log the actual URL for debugging
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