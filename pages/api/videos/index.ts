import { createApiRoute, validateBody, validateQuery, requireAuth, withPagination } from '@/src/lib/api-handler'
import { videoService } from '@/src/services/video.service'
import { createVideoSchema, videoFilterSchema } from '@/src/lib/validation'
import { VideoFilters, VideoUploadForm } from '@/src/types'

export default createApiRoute({
  GET: validateQuery<VideoFilters>(videoFilterSchema, async (ctx, query) => {
    const result = await videoService.getVideos(query)
    return result
  }),
  
  POST: requireAuth(validateBody<VideoUploadForm>(createVideoSchema, async (ctx, body) => {
    const result = await videoService.createVideo({
      title: body.title,
      originalUrl: body.originalUrl,
      description: body.description,
      embedUrl: '', // Will be generated in service
      thumbnail: null,
      userId: ctx.user!.id,
      tags: body.tags as any // Service will handle string to tags conversion
    }, ctx.user!.id)
    return result
  }))
}, {
  methods: ['GET', 'POST'],
  requireAuth: false // GET doesn't require auth, POST is handled individually
})