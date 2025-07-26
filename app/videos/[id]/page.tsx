'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeftIcon, StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { AddTagInput } from '@/components/AddTagInput'
import { CommentSection } from '@/components/CommentSection'

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
    tag: {
      id: string
      name: string
    }
  }>
  _count: {
    ratings: number
  }
}

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [video, setVideo] = useState<Video | null>(null)
  const [localTags, setLocalTags] = useState<Array<{ tag: { id: string; name: string } }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRating, setIsRating] = useState(false)

  useEffect(() => {
    if (params?.id) {
      loadVideo()
    }
  }, [params?.id])

  useEffect(() => {
    if (video) {
      setLocalTags(video.tags)
    }
  }, [video])

  const loadVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${params?.id}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to load video')
      }
      
      const result = await response.json()
      if (result.data?.video) {
        setVideo(result.data.video)
      } else {
        throw new Error('Video not found')
      }
    } catch (error) {
      toast.error('Failed to load video')
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const getAverageRating = (tagId: string) => {
    if (!video?.ratings || !Array.isArray(video.ratings)) return 0
    const tagRatings = video.ratings.filter(r => r.tag.id === tagId)
    if (tagRatings.length === 0) return 0
    return tagRatings.reduce((sum, r) => sum + r.level, 0) / tagRatings.length
  }

  const handleRate = async (tagId: string, level: number) => {
    if (!session) {
      toast.error('Please sign in to rate videos')
      return
    }

    if (!video) return

    setIsRating(true)
    try {
      const response = await fetch(`/api/videos/${video.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tagId, level }),
      })

      if (!response.ok) {
        throw new Error('Failed to rate video')
      }

      toast.success('Rating submitted!')
      loadVideo() // Reload to get updated ratings
    } catch (error) {
      toast.error('Failed to submit rating')
    } finally {
      setIsRating(false)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!session || !video) {
      toast.error('Please sign in to remove tags')
      return
    }

    try {
      const response = await fetch(`/api/videos/${video.id}/tags?tagId=${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove tag')
      }

      setLocalTags(prev => prev.filter(videoTag => videoTag.tag.id !== tagId))
      toast.success('Tag removed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove tag')
    }
  }

  const handleTagAdded = (newTag: { id: string; name: string }) => {
    setLocalTags(prev => [...prev, { tag: newTag }])
  }

  const renderStars = (tagId: string, currentRating: number) => {
    return [...Array(5)].map((_, i) => {
      const filled = i < Math.round(currentRating)
      return (
        <button
          key={i}
          onClick={() => handleRate(tagId, i + 1)}
          disabled={isRating || !session}
          className="text-yellow-400 hover:text-yellow-500 disabled:opacity-50"
        >
          {filled ? (
            <StarIcon className="h-5 w-5" />
          ) : (
            <StarOutlineIcon className="h-5 w-5" />
          )}
        </button>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Video not found</h1>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {video.title}
                </h1>
                <p className="text-gray-600 mb-4">
                  by {video.user.firstName || video.user.username}
                </p>
                {video.description && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{video.description}</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span>{video._count?.ratings || 0} ratings</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
              <CommentSection videoId={video.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags & Ratings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Tags & Ratings</h3>
              <div className="space-y-3">
                {localTags && Array.isArray(localTags) && localTags.map(({ tag }) => {
                  const avgRating = getAverageRating(tag.id)
                  return (
                    <div key={tag.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">
                          {tag.name}
                        </span>
                        {session && (
                          <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                            title="Remove tag"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(tag.id, avgRating)}
                        <span className="text-sm text-gray-500 ml-2">
                          ({avgRating.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  )
                })}
                
                {session && (
                  <div className="pt-3 border-t border-gray-200">
                    <AddTagInput 
                      videoId={video.id} 
                      onTagAdded={handleTagAdded}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Video Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Uploaded by:</span>
                  <span className="ml-2 font-medium">
                    {video.user.firstName || video.user.username}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Upload date:</span>
                  <span className="ml-2">
                    {new Date(video.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Total ratings:</span>
                  <span className="ml-2">{video._count?.ratings || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Original URL:</span>
                  <a 
                    href={video.originalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-700 break-all"
                  >
                    View Original
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}