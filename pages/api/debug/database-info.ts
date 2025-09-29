import { createApiRoute } from '@/src/lib/api-handler'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default createApiRoute({
  GET: async (ctx) => {
    try {
      // Get database connection info (safely)
      const dbUrl = process.env.DATABASE_URL
      const maskedUrl = dbUrl ? dbUrl.replace(/:[^:@]*@/, ':***@') : 'Not set'
      
      // Get sample video data
      const sampleVideo = await prisma.video.findFirst({
        select: {
          id: true,
          title: true,
          originalUrl: true,
          thumbnail: true,
          previewUrl: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Get video count
      const totalCount = await prisma.video.count()
      
      // Get count by thumbnail presence
      const withThumbnails = await prisma.video.count({
        where: {
          thumbnail: {
            not: null
          }
        }
      })

      // Get ID patterns
      const recentVideoIds = await prisma.video.findMany({
        select: { id: true },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      return {
        success: true,
        data: {
          database: {
            url: maskedUrl,
            connected: true
          },
          stats: {
            totalVideos: totalCount,
            videosWithThumbnails: withThumbnails,
            thumbnailCoverage: Math.round((withThumbnails / totalCount) * 100)
          },
          sampleData: {
            latestVideo: sampleVideo,
            recentIds: recentVideoIds.map(v => v.id)
          },
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          database: {
            url: process.env.DATABASE_URL ? 'Set (masked)' : 'Not set',
            connected: false
          }
        }
      }
    }
  }
}, {
  methods: ['GET'],
  requireAuth: false
})