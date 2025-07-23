import { createApiRoute, requireAuth, validateBody } from '@/src/lib/api-handler'
import { videoService } from '@/src/services/video.service'
import { ratingSchema } from '@/src/lib/validation'
import { VideoRatingForm } from '@/src/types'

export default createApiRoute({
  POST: requireAuth(validateBody<VideoRatingForm>(ratingSchema, async (ctx, body) => {
    const { id } = ctx.req.query
    const result = await videoService.rateVideo(
      id as string,
      body.tagId,
      body.level,
      ctx.user!.id
    )
    return result
  }))
}, {
  methods: ['POST'],
  requireAuth: true
})