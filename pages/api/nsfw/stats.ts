import { createApiRoute } from '@/lib/api-handler'
import { nsfwService } from '@/services/nsfw.service'

export default createApiRoute({
  GET: async (ctx) => {
    const stats = await nsfwService.getNSFWStats()
    
    return ctx.res.status(200).json({
      success: true,
      data: stats
    })
  }
}, {
  methods: ['GET']
})