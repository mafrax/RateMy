import { createApiRoute, validateBody, validateQuery, requireAuth, withPagination } from '@/src/lib/api-handler'
import { videoService } from '@/src/services/video.service'
import { createVideoSchema, videoFilterQuerySchema } from '@/src/lib/validation'
import { VideoFilters, VideoUploadForm } from '@/src/types'

export default async (req: any, res: any) => {
  if (req.method === 'GET') {
    // Handle GET requests without auth
    return createApiRoute({
      GET: validateQuery<VideoFilters>(videoFilterQuerySchema, async (ctx, query) => {
        const result = await videoService.getVideos(query)
        return result
      })
    }, {
      methods: ['GET'],
      requireAuth: false
    })(req, res)
  } else if (req.method === 'POST') {
    // Handle POST requests with auth
    return createApiRoute({
      POST: validateBody<VideoUploadForm>(createVideoSchema, async (ctx, body) => {
        const result = await videoService.createVideo({
          title: body.title,
          originalUrl: body.originalUrl,
          description: body.description,
          embedUrl: body.embedUrl || '', // Use provided or generate in service
          thumbnail: body.thumbnail || null,
          previewUrl: body.previewUrl || null,
          isNsfw: body.isNsfw || false,
          userId: ctx.user!.id,
          tags: body.tags as any, // Service will handle string to tags conversion
          tagRatings: body.tagRatings || [] // Tag ratings from upload flow
        }, ctx.user!.id)
        return result
      })
    }, {
      methods: ['POST'],
      requireAuth: true // Enable auth for POST
    })(req, res)
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}