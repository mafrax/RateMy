import { createApiRoute, requireAuth, validateBody } from '@/src/lib/api-handler'
import { nsfwService } from '@/src/services/nsfw.service'
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

    const validatedBody = body as z.infer<typeof updateNSFWSchema>
    await nsfwService.markVideo(videoId, validatedBody.isNSFW, ctx.user!.id)
    
    return ctx.res.status(200).json({
      success: true,
      message: `Video marked as ${validatedBody.isNSFW ? 'NSFW' : 'safe'}`
    })
  }))
}, {
  methods: ['PATCH']
})