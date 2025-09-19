import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../src/lib/auth'
import { userService } from '../../../../src/services/user.service'
import { videoService } from '../../../../src/services/video.service'
import { ratingRepository } from '../../../../src/repositories/rating.repository'
import { videoRepository } from '../../../../src/repositories/video.repository'

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

    // Check if this is the user's own profile or if they're viewing someone else's
    const sessionUserId = (session.user as any)?.id
    const isOwnProfile = sessionUserId === userId
    
    // For other users' profiles, we'll return limited statistics

    // Get user statistics (limited for other users)
    const [
      userWithStats,
      userVideos,
      userRatings,
      followCounts
    ] = await Promise.all([
      userService.getUserWithStats(userId),
      videoService.getVideosByUser(userId),
      isOwnProfile ? ratingRepository.findRatingsByUser(userId) : Promise.resolve([]),
      userService.getFollowCounts(userId)
    ])

    if (!userWithStats.success || !userVideos.success || !followCounts.success) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const videos = userVideos.data || []
    const ratings = userRatings || []

    // Calculate advanced statistics
    const totalRatings = videos.reduce((sum, video) => sum + (video._count?.ratings || 0), 0)
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0)
    
    // Average rating received across all videos
    let averageRatingReceived = 0
    if (totalRatings > 0) {
      const allVideoRatings = videos.flatMap(video => video.ratings || [])
      const ratingSum = allVideoRatings.reduce((sum, rating) => sum + rating.level, 0)
      averageRatingReceived = ratingSum / allVideoRatings.length
    }

    // Average rating given by user
    let averageRatingGiven = 0
    if (ratings.length > 0) {
      const ratingSum = ratings.reduce((sum, rating) => sum + rating.level, 0)
      averageRatingGiven = ratingSum / ratings.length
    }

    // Most popular tags from user's videos
    const tagFrequency: Record<string, number> = {}
    videos.forEach(video => {
      video.tags?.forEach(videoTag => {
        const tagName = videoTag.tag.name
        tagFrequency[tagName] = (tagFrequency[tagName] || 0) + 1
      })
    })

    const popularTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Most actively rated tags by user
    const ratingTagFrequency: Record<string, { count: number; averageRating: number; totalRating: number }> = {}
    ratings.forEach(rating => {
      const tagName = rating.tag.name
      if (!ratingTagFrequency[tagName]) {
        ratingTagFrequency[tagName] = { count: 0, averageRating: 0, totalRating: 0 }
      }
      ratingTagFrequency[tagName].count++
      ratingTagFrequency[tagName].totalRating += rating.level
      ratingTagFrequency[tagName].averageRating = ratingTagFrequency[tagName].totalRating / ratingTagFrequency[tagName].count
    })

    const mostRatedTags = Object.entries(ratingTagFrequency)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        averageRating: Math.round(data.averageRating * 10) / 10
      }))

    // Upload frequency analysis
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    const uploadsLast30Days = videos.filter(video => 
      new Date(video.createdAt) >= thirtyDaysAgo
    ).length

    const uploadsLast7Days = videos.filter(video => 
      new Date(video.createdAt) >= sevenDaysAgo
    ).length

    // Best performing video
    let bestPerformingVideo = null
    if (videos.length > 0) {
      bestPerformingVideo = videos.reduce((best, video) => {
        const videoRatingCount = video._count?.ratings || 0
        const bestRatingCount = best._count?.ratings || 0
        return videoRatingCount > bestRatingCount ? video : best
      })
    }

    // Calculate join date
    const joinDate = userWithStats.data.createdAt

    // Create stats object based on profile visibility
    const stats = {
      basic: {
        videosUploaded: videos.length,
        totalRatingsReceived: totalRatings,
        totalRatingsGiven: isOwnProfile ? ratings.length : 0,
        totalViews: totalViews,
        followers: followCounts.data?.followers || 0,
        following: isOwnProfile ? (followCounts.data?.following || 0) : 0,
        joinDate
      },
      performance: {
        averageRatingReceived: Math.round(averageRatingReceived * 10) / 10,
        averageRatingGiven: isOwnProfile ? Math.round(averageRatingGiven * 10) / 10 : 0,
        uploadsLast30Days: isOwnProfile ? uploadsLast30Days : 0,
        uploadsLast7Days: isOwnProfile ? uploadsLast7Days : 0,
        bestPerformingVideo: bestPerformingVideo ? {
          id: bestPerformingVideo.id,
          title: bestPerformingVideo.title,
          ratingsCount: bestPerformingVideo._count?.ratings || 0
        } : null
      },
      preferences: {
        popularTags,
        mostRatedTags: isOwnProfile ? mostRatedTags : []
      }
    }

    return res.status(200).json({
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}