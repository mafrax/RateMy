import { createApiRoute, validateBody, validateQuery, requireAuth } from '@/src/lib/api-handler'
import { videoService } from '@/src/services/video.service'
import { createVideoSchema, videoFilterQuerySchema } from '@/src/lib/validation'
import { VideoFilters, VideoUploadForm } from '@/src/types'

export default createApiRoute({
  GET: validateQuery<VideoFilters>(videoFilterQuerySchema, async (ctx, query) => {
    const result = await videoService.getVideos(query)
    return result
  }),
  
  POST: validateBody<VideoUploadForm>(createVideoSchema, async (ctx, body) => {
    if (!ctx.user) {
      throw new Error('Authentication required')
    }
    
    const result = await videoService.createVideo({
      title: body.title,
      originalUrl: body.originalUrl,
      description: body.description,
      embedUrl: body.embedUrl || '', // Use provided or generate in service
      thumbnail: body.thumbnail || null,
      previewUrl: body.previewUrl || null,
      isNsfw: body.isNsfw || false,
      userId: ctx.user.id,
      tags: body.tags as any, // Service will handle string to tags conversion
      tagRatings: body.tagRatings || [] // Tag ratings from upload flow
    }, ctx.user.id)
    return result
  })
}, {
  methods: ['GET', 'POST'],
  requireAuth: { GET: false, POST: true } // Per-method auth configuration
})