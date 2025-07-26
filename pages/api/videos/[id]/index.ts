import { createApiRoute } from '@/src/lib/api-handler'
import { videoService } from '@/src/services/video.service'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/src/lib/auth'

export default createApiRoute({
  GET: async (ctx) => {
    const { id } = ctx.req.query
    
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid video ID')
    }

    // Get single video by ID
    const result = await videoService.getVideoById(id)
    
    if (!result.success || !result.data) {
      throw new Error('Video not found')
    }

    return {
      success: true,
      data: { video: result.data },
      message: 'Video retrieved successfully'
    }
  },

  DELETE: async (ctx) => {
    const { id } = ctx.req.query
    
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid video ID')
    }

    // Get session for authentication since this endpoint isn't globally auth-required
    const session = await getServerSession(ctx.req, ctx.res, authOptions)
    if (!session || !(session.user as any)?.id) {
      throw new Error('Authentication required')
    }

    const userId = (session.user as any).id

    // Delete video (this will check ownership)
    const result = await videoService.deleteVideo(id, userId)
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete video')
    }

    return {
      success: true,
      message: 'Video deleted successfully'
    }
  }
}, {
  methods: ['GET', 'DELETE'],
  requireAuth: false
})