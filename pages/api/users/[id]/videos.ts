import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../src/lib/auth'
import { videoService } from '../../../../src/services/video.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Get session to verify authentication
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    const { id: userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }

    // Verify user can only access their own videos (for now)
    const sessionUserId = (session.user as any)?.id
    if (sessionUserId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Get videos by user
    const result = await videoService.getVideosByUser(userId)
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to fetch videos'
      })
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Videos retrieved successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}