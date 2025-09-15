import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redGifsService } from '@/src/services/redgifs.service'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/lib/errors'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const { url } = req.body

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'URL is required and must be a string' 
      })
    }

    // Validate that it's a RedGifs URL
    if (!redGifsService.isRedGifsUrl(url)) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL must be a RedGifs URL' 
      })
    }

    logger.info('Processing RedGifs metadata request', { 
      url, 
      userId: (session.user as any)?.id 
    })

    // Get metadata from RedGifs
    const metadata = await redGifsService.getMetadataFromUrl(url)
    
    logger.info('Successfully retrieved RedGifs metadata', { 
      gifId: metadata.id,
      title: metadata.title,
      tags: metadata.tags?.length || 0,
      userId: (session.user as any)?.id
    })

    return res.status(200).json({ 
      success: true, 
      metadata: {
        id: metadata.id,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags || [],
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        views: metadata.views,
        likes: metadata.likes,
        userName: metadata.userName,
        thumbnailUrl: redGifsService.getThumbnailUrl(metadata.id),
        embedUrl: redGifsService.getEmbedUrl(metadata.id)
      }
    })

  } catch (error) {
    logger.error('Failed to fetch RedGifs metadata', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.body.url,
      userId: (req as any).session?.user?.id
    })

    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      })
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch metadata from RedGifs' 
    })
  }
}