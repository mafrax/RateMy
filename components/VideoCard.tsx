'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface VideoCardProps {
  video: {
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
}

export function VideoCard({ video }: VideoCardProps) {
  const { data: session } = useSession()
  const [isRating, setIsRating] = useState(false)

  const getAverageRating = (tagId: string) => {
    if (!video.ratings || !Array.isArray(video.ratings)) return 0
    const tagRatings = video.ratings.filter(r => r.tag.id === tagId)
    if (tagRatings.length === 0) return 0
    return tagRatings.reduce((sum, r) => sum + r.level, 0) / tagRatings.length
  }

  const handleRate = async (tagId: string, level: number) => {
    if (!session) {
      toast.error('Please sign in to rate videos')
      return
    }

    setIsRating(true)
    try {
      const response = await fetch(`/api/videos/${video.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagId, level }),
      })

      if (!response.ok) {
        throw new Error('Failed to rate video')
      }

      toast.success('Rating submitted!')
      // You might want to refresh the video data here
    } catch (error) {
      toast.error('Failed to submit rating')
    } finally {
      setIsRating(false)
    }
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
            <StarIcon className="h-4 w-4" />
          ) : (
            <StarOutlineIcon className="h-4 w-4" />
          )}
        </button>
      )
    })
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="aspect-video mb-4">
        <iframe
          src={video.embedUrl}
          title={video.title}
          className="w-full h-full rounded-lg"
          allowFullScreen
        />
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            <Link href={`/videos/${video.id}`} className="hover:text-primary-600">
              {video.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-500">
            by {video.user.firstName || video.user.username}
          </p>
        </div>

        {video.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {video.description}
          </p>
        )}

        <div className="space-y-2">
          {video.tags && Array.isArray(video.tags) && video.tags.map(({ tag }) => {
            const avgRating = getAverageRating(tag.id)
            return (
              <div key={tag.id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {tag.name}
                </span>
                <div className="flex items-center space-x-1">
                  {renderStars(tag.id, avgRating)}
                  <span className="text-xs text-gray-500 ml-2">
                    ({avgRating.toFixed(1)})
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span>{video._count?.ratings || 0} ratings</span>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}