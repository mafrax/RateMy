'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { FlexibleVideoGrid } from '../../components/FlexibleVideoGrid'
import { UserVideoCard } from '../../components/UserVideoCard'

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

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin')
      return
    }

    fetchUserVideos()
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

  const handleVideoDelete = (videoId: string) => {
    setVideos(prev => prev.filter(video => video.id !== videoId))
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
          <div className="flex items-center space-x-4">
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
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-sm text-gray-500">
                  {videos.length} video{videos.length !== 1 ? 's' : ''} uploaded
                </p>
                {videos.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {videos.reduce((total, video) => total + (video._count?.ratings || 0), 0)} total ratings
                  </p>
                )}
              </div>
            </div>
          </div>
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

          {loading || error ? (
            <FlexibleVideoGrid 
              videos={[]}
              loading={loading}
              error={error}
              onRetry={fetchUserVideos}
              onVideoUpdate={fetchUserVideos}
            />
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
              <p className="text-gray-500 mb-4">Upload your first video to get started!</p>
              <a 
                href="/upload"
                className="btn-primary"
              >
                Upload Video
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Layout Controls - Simple version for profile */}
              <div className="flex justify-end">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Grid layout:</span>
                  <div className="text-sm text-gray-500">Auto-responsive</div>
                </div>
              </div>

              {/* User Videos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <UserVideoCard 
                    key={video.id} 
                    video={video} 
                    onVideoUpdate={fetchUserVideos}
                    onVideoDelete={handleVideoDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}