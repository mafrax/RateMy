import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redGifsService } from '@/src/services/redgifs.service'
import { logger } from '@/lib/logger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const { query, page = '1', count = '20', order = 'trending' } = req.query

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      })
    }

    const pageNum = parseInt(page as string) || 1
    const countNum = Math.min(parseInt(count as string) || 20, 50) // Max 50 per request
    const orderBy = ['trending', 'latest', 'top'].includes(order as string) 
      ? order as 'trending' | 'latest' | 'top' 
      : 'trending'

    logger.info('Processing RedGifs search request', { 
      query, 
      page: pageNum, 
      count: countNum, 
      order: orderBy,
      userId: (session.user as any)?.id 
    })

    const results = await redGifsService.searchGifs(query, {
      page: pageNum,
      count: countNum,
      order: orderBy
    })
    
    logger.info('Successfully completed RedGifs search', { 
      query,
      results: results.gifs.length,
      total: results.total,
      userId: (session.user as any)?.id
    })

    return res.status(200).json({ 
      success: true, 
      data: {
        gifs: results.gifs.map(gif => ({
          id: gif.id,
          title: gif.title,
          description: gif.description,
          tags: gif.tags || [],
          duration: gif.duration,
          width: gif.width,
          height: gif.height,
          views: gif.views,
          likes: gif.likes,
          userName: gif.userName,
          thumbnailUrl: redGifsService.getThumbnailUrl(gif.id),
          embedUrl: redGifsService.getEmbedUrl(gif.id),
          originalUrl: `https://www.redgifs.com/watch/${gif.id}`
        })),
        pagination: {
          page: results.page,
          total: results.total,
          hasMore: results.gifs.length === countNum
        }
      }
    })

  } catch (error) {
    logger.error('Failed to search RedGifs', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query.query,
      userId: (req as any).session?.user?.id
    })

    return res.status(500).json({ 
      success: false, 
      message: 'Failed to search RedGifs content' 
    })
  }
}