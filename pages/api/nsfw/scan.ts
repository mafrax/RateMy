import { createApiRoute, requireAuth } from '@/lib/api-handler'
import { nsfwService } from '@/services/nsfw.service'

export default createApiRoute({
  POST: requireAuth(async (ctx) => {
    const result = await nsfwService.bulkScanVideos(ctx.user!.id)
    
    return ctx.res.status(200).json({
      success: true,
      data: result,
      message: `Scanned ${result.scanned} videos, updated ${result.updated}`
    })
  })
}, {
  methods: ['POST']
})