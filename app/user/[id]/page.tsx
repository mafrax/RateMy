'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { VideoGrid } from '@/components/VideoGrid'
import { SearchBar } from '@/components/SearchBar'

interface TagRatingFilter {
  tagName: string
  minRating: number
  maxRating: number
}

interface SearchFilters {
  search: string
  tags: string[]
  tagRatings: TagRatingFilter[]
  includeNsfw: boolean
  sortBy: 'createdAt' | 'title' | 'ratings'
  sortOrder: 'desc' | 'asc'
  page: number
  limit: number
  userId?: string
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

interface UserProfile {
  id: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  createdAt: string
}

export default function UserProfilePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const userId = params?.id as string
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (userId) {
      // Check if this is the user's own profile
      if (session?.user && (session.user as any)?.id === userId) {
        setIsOwnProfile(true)
      }
      
      fetchUserProfile()
      setUserVideoFilters()
      fetchUserStats()
    }
  }, [userId, session, status])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const data = await response.json()
      console.log('User profile response:', data)

      if (data.success && data.data) {
        setUserProfile(data.data)
      } else {
        setError('User not found')
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const setUserVideoFilters = () => {
    if (!userId) return
    
    // Set search filters to show only this user's videos
    setSearchFilters({
      search: '',
      tags: [],
      tagRatings: [],
      includeNsfw: true, // Show all content in user profile
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
      userId: userId
    })
  }

  const handleSearch = (filters: SearchFilters) => {
    if (!userId) return
    
    const userFilters = {
      ...filters,
      userId: userId // Always filter by the specific user
    }
    setSearchFilters(userFilters)
  }

  const handleIncludeNsfwChange = (includeNsfw: boolean) => {
    if (!userId) return
    
    setSearchFilters(prev => prev ? { ...prev, includeNsfw } : {
      search: '',
      tags: [],
      tagRatings: [],
      includeNsfw,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
      userId: userId
    })
  }

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch(`/api/users/${userId}/stats`, {
        credentials: 'include'
      })

      if (!response.ok) {
        // Don't throw error for stats as they might not be accessible for other users
        setStats(null)
        return
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
      // Don't set error here as stats are optional
    } finally {
      setStatsLoading(false)
    }
  }


  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const displayName = userProfile.firstName || userProfile.username || 'User'

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {displayName}'s Profile
                {isOwnProfile && <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(Your Profile)</span>}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {userProfile.firstName && userProfile.lastName 
                  ? `${userProfile.firstName} ${userProfile.lastName}` 
                  : `@${userProfile.username}`
                }
              </p>
              {stats && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Member since {new Date(stats.basic.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Enhanced Statistics Dashboard - Only show for own profile or if stats are available */}
          {(isOwnProfile || stats) && (
            <>
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
                    {isOwnProfile && (
                      <>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{stats.basic.totalRatingsGiven}</div>
                          <div className="text-sm text-gray-600">Ratings Given</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{stats.basic.followers}</div>
                          <div className="text-sm text-gray-600">Followers</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Performance Metrics - Show limited info for other users */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">Performance</div>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg. Rating Received:</span>
                          <span className="font-semibold">{stats.performance.averageRatingReceived}/10</span>
                        </div>
                        {isOwnProfile && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg. Rating Given:</span>
                            <span className="font-semibold">{stats.performance.averageRatingGiven}/10</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isOwnProfile && (
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
                    )}

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

                  {/* Popular Tags - Show for all if available */}
                  {(stats.preferences.popularTags.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      {isOwnProfile && stats.preferences.mostRatedTags.length > 0 && (
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
                  <p className="text-gray-500">Statistics not available</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Search and Videos Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isOwnProfile ? 'My Videos' : `${displayName}'s Videos`}
          </h2>
          {isOwnProfile && (
            <a 
              href="/upload"
              className="btn-primary"
            >
              Upload New Video
            </a>
          )}
        </div>
      </div>

      {/* Full Width Videos Section */}
      <div className="space-y-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} />
        </div>
        <VideoGrid 
          searchFilters={searchFilters} 
          includeNsfw={searchFilters?.includeNsfw ?? true}
          onIncludeNsfwChange={handleIncludeNsfwChange}
        />
      </div>
    </div>
  )
}