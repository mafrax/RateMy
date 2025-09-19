'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { FlexibleVideoGrid } from '../../components/FlexibleVideoGrid'

interface Video {
  id: string
  title: string
  embedUrl: string
  originalUrl: string
  thumbnail?: string
  description?: string
  createdAt: string
  user: {
    id: string
    username: string
    firstName?: string
    lastName?: string
  }
  tags: Array<{
    tag: {
      id: string
      name: string
    }
  }>
  ratings: Array<{
    level: number
    user: {
      id: string
      username: string
      firstName?: string
      lastName?: string
      avatar?: string
    }
    tag: {
      id: string
      name: string
    }
  }>
  _count: {
    ratings: number
  }
}

interface UserStats {
  basic: {
    videosUploaded: number
    totalRatingsReceived: number
    totalRatingsGiven: number
    totalViews: number
    followers: number
    following: number
    joinDate: string
  }
  performance: {
    averageRatingReceived: number
    averageRatingGiven: number
    uploadsLast30Days: number
    uploadsLast7Days: number
    bestPerformingVideo: {
      id: string
      title: string
      ratingsCount: number
    } | null
  }
  preferences: {
    popularTags: Array<{ name: string; count: number }>
    mostRatedTags: Array<{ name: string; count: number; averageRating: number }>
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [videos, setVideos] = useState<Video[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin')
      return
    }

    fetchUserVideos()
    fetchUserStats()
  }, [session, status])

  const fetchUserVideos = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/users/${(session.user as any)?.id}/videos`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user videos')
      }

      const data = await response.json()
      console.log('User videos response:', data)

      if (data.success && data.data) {
        setVideos(data.data)
      } else {
        setVideos([])
      }
    } catch (err) {
      console.error('Error fetching user videos:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    if (!session?.user) return

    try {
      setStatsLoading(true)
      const response = await fetch(`/api/users/${(session.user as any)?.id}/stats`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user statistics')
      }

      const data = await response.json()
      console.log('User stats response:', data)

      if (data.success && data.data) {
        setStats(data.data)
      } else {
        setStats(null)
      }
    } catch (err) {
      console.error('Error fetching user stats:', err)
      // Don't set error here as it's not critical
    } finally {
      setStatsLoading(false)
    }
  }


  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  const user = session.user as any
  const displayName = user?.firstName || user?.username || 'User'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{displayName}'s Profile</h1>
              <p className="text-gray-600">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : `@${user?.username}`
                }
              </p>
              {stats && (
                <p className="text-sm text-gray-500 mt-1">
                  Member since {new Date(stats.basic.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Enhanced Statistics Dashboard */}
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Basic Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.basic.videosUploaded}</div>
                  <div className="text-sm text-gray-600">Videos Uploaded</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.basic.totalRatingsReceived}</div>
                  <div className="text-sm text-gray-600">Ratings Received</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.basic.totalRatingsGiven}</div>
                  <div className="text-sm text-gray-600">Ratings Given</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.basic.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">Performance</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Rating Received:</span>
                      <span className="font-semibold">{stats.performance.averageRatingReceived}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Rating Given:</span>
                      <span className="font-semibold">{stats.performance.averageRatingGiven}/10</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">Activity</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uploads (30 days):</span>
                      <span className="font-semibold">{stats.performance.uploadsLast30Days}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uploads (7 days):</span>
                      <span className="font-semibold">{stats.performance.uploadsLast7Days}</span>
                    </div>
                  </div>
                </div>

                {stats.performance.bestPerformingVideo && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">Best Video</div>
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {stats.performance.bestPerformingVideo.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stats.performance.bestPerformingVideo.ratingsCount} ratings
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Popular Tags */}
              {(stats.preferences.popularTags.length > 0 || stats.preferences.mostRatedTags.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.preferences.popularTags.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 mb-3">Most Used Tags</div>
                      <div className="space-y-2">
                        {stats.preferences.popularTags.slice(0, 3).map((tag) => (
                          <div key={tag.name} className="flex justify-between items-center">
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {tag.name}
                            </span>
                            <span className="text-sm text-gray-600">{tag.count} videos</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.preferences.mostRatedTags.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 mb-3">Most Rated Tags</div>
                      <div className="space-y-2">
                        {stats.preferences.mostRatedTags.slice(0, 3).map((tag) => (
                          <div key={tag.name} className="flex justify-between items-center">
                            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                              {tag.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              {tag.count} ratings (avg: {tag.averageRating})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Unable to load statistics</p>
            </div>
          )}
        </div>

        {/* Videos Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">My Videos</h2>
            <a 
              href="/upload"
              className="btn-primary"
            >
              Upload New Video
            </a>
          </div>

          <FlexibleVideoGrid 
            videos={videos}
            loading={loading}
            error={error}
            onRetry={fetchUserVideos}
            onVideoUpdate={fetchUserVideos}
          />
        </div>
      </div>
    </div>
  )
}