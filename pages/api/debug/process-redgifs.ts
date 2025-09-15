import { NextApiRequest, NextApiResponse } from 'next'
import { redGifsService } from '@/src/services/redgifs.service'
import { createApiRoute } from '@/src/lib/api-handler'

// Debug endpoint to process RedGifs URLs
export default createApiRoute({
  POST: async (ctx) => {
    const { url } = ctx.req.body
    
    if (!url) {
      return {
        success: false,
        message: 'URL is required'
      }
    }

    try {
      // Use the existing RedGifs service to process the URL
      const processedData = await redGifsService.processRedGifsUrl(url)
      
      return {
        success: true,
        data: {
          embedUrl: processedData.embedUrl,
          thumbnail: processedData.thumbnail,
          metadata: processedData.metadata,
          tags: processedData.tags
        }
      }
    } catch (error) {
      console.error('Failed to process RedGifs URL:', error)
      
      // Return fallback data
      const match = url.match(/\/watch\/([a-zA-Z0-9]+)/)
      const gifId = match ? match[1] : 'unknown'
      
      return {
        success: true,
        data: {
          embedUrl: `https://www.redgifs.com/ifr/${gifId}?poster=0`,
          thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`,
          metadata: {
            id: gifId,
            title: `RedGif ${gifId}`,
            description: 'RedGifs content'
          },
          tags: ['redgifs']
        }
      }
    }
  }
}, {
  methods: ['POST'],
  requireAuth: false
})