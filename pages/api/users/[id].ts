import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../src/lib/auth'
import { userService } from '../../../src/services/user.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Get session to verify authentication (optional for viewing public profiles)
    const session = await getServerSession(req, res, authOptions)

    const { id: userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }

    // Get user profile
    const result = await userService.getUserById(userId)
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'User not found'
      })
    }

    // Return basic user profile information (safe for public viewing)
    const userProfile = {
      id: result.data.id,
      username: result.data.username,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      avatar: result.data.avatar,
      createdAt: result.data.createdAt
    }

    return res.status(200).json({
      success: true,
      data: userProfile,
      message: 'User profile retrieved successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}