import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Starting thumbnail regeneration...')
    
    // Get all videos without thumbnails
    const videosWithoutThumbnails = await prisma.video.findMany({
      where: {
        OR: [
          { thumbnail: null },
          { thumbnail: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        originalUrl: true,
        thumbnail: true
      }
    })

    console.log(`Found ${videosWithoutThumbnails.length} videos without thumbnails`)

    const results = []
    let updated = 0

    for (const video of videosWithoutThumbnails) {
      try {
        let thumbnailUrl = null

        // Generate thumbnail based on platform
        if (video.originalUrl?.includes('youtube.com') || video.originalUrl?.includes('youtu.be')) {
          // Extract YouTube video ID and generate thumbnail URL
          const videoId = extractYouTubeId(video.originalUrl)
          if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          }
        } else if (video.originalUrl?.includes('pornhub.com') || video.originalUrl?.includes('pornhub.org')) {
          // For Pornhub, we'd need to extract from the page (complex)
          // For now, set a placeholder that will be updated by upload flow
          thumbnailUrl = null // Will be handled by metadata extraction
        } else if (video.originalUrl?.includes('xhamster.com')) {
          // For XHamster, similar situation
          thumbnailUrl = null // Will be handled by metadata extraction
        } else if (video.originalUrl?.includes('redgifs.com')) {
          // For RedGifs, generate from ID
          const gifId = extractRedGifsId(video.originalUrl)
          if (gifId) {
            thumbnailUrl = `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
          }
        }

        if (thumbnailUrl) {
          await prisma.video.update({
            where: { id: video.id },
            data: { thumbnail: thumbnailUrl }
          })
          updated++
          console.log(`Updated ${video.title}: ${thumbnailUrl}`)
        }

        results.push({
          id: video.id,
          title: video.title,
          originalUrl: video.originalUrl,
          thumbnailGenerated: !!thumbnailUrl,
          thumbnailUrl: thumbnailUrl
        })

      } catch (error) {
        console.error(`Error updating ${video.id}:`, error)
        results.push({
          id: video.id,
          title: video.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    res.json({
      success: true,
      message: `Regenerated thumbnails for ${updated} videos`,
      stats: {
        totalProcessed: videosWithoutThumbnails.length,
        updated: updated,
        failed: videosWithoutThumbnails.length - updated
      },
      results: results
    })

  } catch (error) {
    console.error('Error regenerating thumbnails:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

function extractRedGifsId(url: string): string | null {
  const patterns = [
    /redgifs\.com\/watch\/([a-zA-Z0-9]+)/i,
    /redgifs\.com\/ifr\/([a-zA-Z0-9]+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1].toLowerCase()
    }
  }
  return null
}