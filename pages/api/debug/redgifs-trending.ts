import { NextApiRequest, NextApiResponse } from 'next'
import { redGifsService } from '@/src/services/redgifs.service'
import { createApiRoute } from '@/src/lib/api-handler'

// Debug endpoint to fetch trending RedGifs
export default createApiRoute({
  GET: async (ctx) => {
    try {
      // Fetch trending gifs from RedGifs API
      const trendingGifs = await redGifsService.getTrendingGifs(10)
      
      // Transform to expected format for our upload script
      const formattedGifs = trendingGifs.map(gif => ({
        id: gif.id,
        title: gif.title || `RedGif ${gif.id}`,
        description: gif.description || 'Trending RedGif content',
        tags: gif.tags || ['trending', 'redgifs'],
        originalUrl: `https://www.redgifs.com/watch/${gif.id}`,
        views: gif.views,
        likes: gif.likes,
        userName: gif.userName
      }))

      return {
        success: true,
        data: {
          gifs: formattedGifs,
          count: formattedGifs.length
        }
      }
    } catch (error) {
      console.error('Failed to fetch trending RedGifs:', error)
      
      // Return fallback trending list for testing
      const fallbackGifs = [
        {
          id: 'admiringcalmgreyhounddog',
          title: 'Trending RedGif #1',
          description: 'Popular trending content',
          tags: ['trending', 'redgifs', 'popular'],
          originalUrl: 'https://www.redgifs.com/watch/admiringcalmgreyhounddog',
          views: 10000,
          likes: 500,
          userName: 'testuser'
        },
        {
          id: 'anchoredimpolitedeer',
          title: 'Trending RedGif #2', 
          description: 'Popular trending content',
          tags: ['trending', 'redgifs', 'popular'],
          originalUrl: 'https://www.redgifs.com/watch/anchoredimpolitedeer',
          views: 9500,
          likes: 480,
          userName: 'testuser'
        }
      ]
      
      return {
        success: true,
        data: {
          gifs: fallbackGifs,
          count: fallbackGifs.length
        }
      }
    }
  }
}, {
  methods: ['GET'],
  requireAuth: false // Debug endpoint, no auth required
})