import { createApiRoute, validateBody, requireAuth } from '@/src/lib/api-handler'
import { videoService } from '@/src/services/video.service'
import { tagService } from '@/src/services/tag.service'
import { z } from 'zod'

const addTagSchema = z.object({
  tagName: z.string().min(1, 'Tag name is required').max(50, 'Tag name is too long').trim()
})

export default createApiRoute({
  POST: requireAuth(validateBody(addTagSchema, async (ctx, body: { tagName: string }) => {
    const { id: videoId } = ctx.req.query
    
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid video ID')
    }

    // Check if video exists and user has permission (video owner or admin)
    const video = await videoService.getVideoById(videoId)
    if (!video) {
      throw new Error('Video not found')
    }

    // For now, allow any logged-in user to add tags
    // You can add permission checking here if needed
    // if (video.userId !== ctx.user!.id) {
    //   throw new Error('Not authorized to add tags to this video')
    // }

    // Get or create the tag
    const tag = await tagService.getOrCreateTag(body.tagName.toLowerCase())
    
    // Add tag to video (this will handle duplicates)
    const result = await videoService.addTagToVideo(videoId, tag.id)
    
    return {
      success: true,
      data: { tag },
      message: 'Tag added successfully'
    }
  })),

  DELETE: requireAuth(async (ctx) => {
    const { id: videoId, tagId } = ctx.req.query
    
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid video ID')
    }
    
    if (!tagId || typeof tagId !== 'string') {
      throw new Error('Invalid tag ID')
    }

    // Check if video exists and user has permission
    const video = await videoService.getVideoById(videoId)
    if (!video) {
      throw new Error('Video not found')
    }

    // For now, allow any logged-in user to remove tags
    // You can add permission checking here if needed

    // Remove tag from video
    const result = await videoService.removeTagFromVideo(videoId, tagId)
    
    return {
      success: true,
      data: result,
      message: 'Tag removed successfully'
    }
  })
}, {
  methods: ['POST', 'DELETE'],
  requireAuth: true
})