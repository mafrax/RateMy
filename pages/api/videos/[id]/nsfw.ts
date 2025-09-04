import { createApiRoute, requireAuth, validateBody } from '@/lib/api-handler'
import { nsfwService } from '@/services/nsfw.service'
import { z } from 'zod'

const updateNSFWSchema = z.object({
  isNSFW: z.boolean()
})

export default createApiRoute({
  PATCH: requireAuth(validateBody(updateNSFWSchema, async (ctx, body) => {
    const { id } = ctx.req.query
    const videoId = Array.isArray(id) ? id[0] : id
    
    if (!videoId) {
      return ctx.res.status(400).json({
        success: false,
        message: 'Video ID is required'
      })
    }

    await nsfwService.markVideo(videoId, body.isNSFW, ctx.user!.id)
    
    return ctx.res.status(200).json({
      success: true,
      message: `Video marked as ${body.isNSFW ? 'NSFW' : 'safe'}`
    })
  }))
}, {
  methods: ['PATCH']
})