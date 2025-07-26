import { createApiRoute, validateBody, requireAuth } from '@/src/lib/api-handler'
import { db } from '@/src/lib/db'
import { z } from 'zod'

const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long').trim()
})

export default createApiRoute({
  GET: async (ctx) => {
    const { id: videoId } = ctx.req.query
    
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid video ID')
    }

    // Get comments for the video
    const comments = await db.comment.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      data: { comments },
      message: 'Comments retrieved successfully'
    }
  },

  POST: requireAuth(validateBody(addCommentSchema, async (ctx, body: { content: string }) => {
    const { id: videoId } = ctx.req.query
    
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid video ID')
    }

    // Check if video exists
    const video = await db.video.findUnique({
      where: { id: videoId }
    })
    
    if (!video) {
      throw new Error('Video not found')
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        content: body.content,
        videoId,
        userId: ctx.user!.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    return {
      success: true,
      data: { comment },
      message: 'Comment added successfully'
    }
  })),

  DELETE: requireAuth(async (ctx) => {
    const { id: videoId, commentId } = ctx.req.query
    
    if (!commentId || typeof commentId !== 'string') {
      throw new Error('Invalid comment ID')
    }

    // Check if comment exists and user has permission
    const comment = await db.comment.findUnique({
      where: { id: commentId }
    })
    
    if (!comment) {
      throw new Error('Comment not found')
    }

    // Only allow comment owner to delete
    if (comment.userId !== ctx.user!.id) {
      throw new Error('Not authorized to delete this comment')
    }

    // Delete the comment
    await db.comment.delete({
      where: { id: commentId }
    })

    return {
      success: true,
      message: 'Comment deleted successfully'
    }
  })
}, {
  methods: ['GET', 'POST', 'DELETE']
})