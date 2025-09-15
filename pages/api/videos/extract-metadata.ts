import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { videoMetadataService } from '@/src/services/video-metadata.service'
import { xHamsterService } from '@/src/services/xhamster.service'
import { redGifsService } from '@/src/services/redgifs.service'
import { redditService } from '@/src/services/reddit.service'
import { logger } from '@/src/lib/logger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { originalUrl } = req.body
    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl is required' })
    }

    logger.info('Extracting metadata for URL', { url: originalUrl })

    let extractedMetadata, previewUrl, embedUrl

    // Extract metadata based on URL type
    if (xHamsterService.isXHamsterUrl(originalUrl)) {
      try {
        const xHamsterData = await xHamsterService.processXHamsterUrl(originalUrl)
        extractedMetadata = {
          title: xHamsterData.title || '',
          description: xHamsterData.description || '',
          tags: xHamsterData.tags || [],
          thumbnail: xHamsterData.thumbnail
        }
        previewUrl = xHamsterData.previewUrl || null
      } catch (error) {
        logger.error('Failed to process XHamster URL, falling back to standard processing', { error })
        extractedMetadata = await videoMetadataService.extractMetadata(originalUrl)
      }
    } else if (redGifsService.isRedGifsUrl(originalUrl)) {
      try {
        const redGifsData = await redGifsService.processRedGifsUrl(originalUrl)
        extractedMetadata = {
          title: redGifsData.metadata.title,
          description: redGifsData.metadata.description || '',
          tags: redGifsData.tags,
          thumbnail: redGifsData.thumbnail
        }
        embedUrl = redGifsData.embedUrl
      } catch (error) {
        logger.error('Failed to process RedGifs URL, falling back to standard processing', { error })
        extractedMetadata = await videoMetadataService.extractMetadata(originalUrl)
      }
    } else if (redditService.isRedditUrl(originalUrl)) {
      try {
        const redditData = await redditService.processRedditUrl(originalUrl)
        extractedMetadata = {
          title: redditData.metadata.title,
          description: redditData.metadata.description || '',
          tags: redditData.tags,
          thumbnail: redditData.thumbnail
        }
        embedUrl = redditData.embedUrl
      } catch (error) {
        logger.error('Failed to process Reddit URL, falling back to standard processing', { error })
        extractedMetadata = await videoMetadataService.extractMetadata(originalUrl)
      }
    } else {
      // Standard metadata extraction
      extractedMetadata = await videoMetadataService.extractMetadata(originalUrl)
    }

    // Generate embed URL if not already set
    if (!embedUrl) {
      embedUrl = convertToEmbedUrl(originalUrl)
    }

    // Generate default title if none found
    let finalTitle = extractedMetadata.title
    if (!finalTitle) {
      if (originalUrl.includes('redgifs.com')) {
        const match = originalUrl.match(/\/watch\/([a-zA-Z0-9]+)/)
        const gifId = match ? match[1] : 'video'
        finalTitle = `RedGifs ${gifId}`
      } else {
        finalTitle = 'Untitled Video'
      }
    }

    // Determine NSFW status
    const isRedGifs = redGifsService.isRedGifsUrl(originalUrl)
    const isReddit = redditService.isRedditUrl(originalUrl)
    const isXHamster = xHamsterService.isXHamsterUrl(originalUrl)
    
    let isNSFW = false
    if (isRedGifs || isXHamster) {
      isNSFW = true // RedGifs and XHamster are automatically NSFW
    } else if (isReddit && extractedMetadata.tags?.includes('nsfw')) {
      isNSFW = true // Reddit marked as NSFW
    }

    const response = {
      success: true,
      metadata: {
        title: finalTitle,
        description: extractedMetadata.description || '',
        tags: extractedMetadata.tags || [],
        thumbnail: extractedMetadata.thumbnail || null,
        previewUrl: previewUrl || null,
        embedUrl,
        isNsfw: isNSFW
      }
    }

    logger.info('Metadata extraction completed', {
      url: originalUrl,
      tagsCount: response.metadata.tags.length,
      hasTitle: !!response.metadata.title,
      hasPreview: !!response.metadata.previewUrl
    })

    res.status(200).json(response)

  } catch (error) {
    logger.error('Error extracting metadata', { error })
    res.status(500).json({ 
      error: 'Failed to extract metadata',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function convertToEmbedUrl(originalUrl: string): string {
  // YouTube URLs
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const youtubeMatch = originalUrl.match(youtubeRegex)
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  // Vimeo URLs
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/
  const vimeoMatch = originalUrl.match(vimeoRegex)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  // RedGifs URLs
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

  // Direct video files
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v']
  const urlPath = new URL(originalUrl).pathname.toLowerCase()
  if (videoExtensions.some(ext => urlPath.endsWith(ext))) {
    return originalUrl
  }

  return originalUrl
}