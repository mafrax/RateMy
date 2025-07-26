'use client'

import { VideoCard } from './VideoCard'
import { useState } from 'react'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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

interface UserVideoCardProps {
  video: Video
  onVideoUpdate?: () => void
  onVideoDelete?: (videoId: string) => void
}

export function UserVideoCard({ video, onVideoUpdate, onVideoDelete }: UserVideoCardProps) {
  const [showActions, setShowActions] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = async () => {
    if (!window.confirm(`Are you sure you want to delete "${video.title}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to delete video`)
      }

      const data = await response.json()
      console.log('Delete response:', data)

      if (onVideoDelete) {
        onVideoDelete(video.id)
      }

      // Show success message
      toast.success('Video deleted successfully!')
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Video Management Actions */}
      {showActions && (
        <div className="absolute top-2 left-2 z-20 flex space-x-1">
          <button
            onClick={() => window.open(`/videos/${video.id}/edit`, '_blank')}
            className="p-2 bg-green-600 bg-opacity-90 hover:bg-opacity-100 text-white rounded-full transition-all shadow-lg"
            title="Edit video"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`p-2 text-white rounded-full transition-all shadow-lg ${
              isDeleting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 bg-opacity-90 hover:bg-opacity-100'
            }`}
            title={isDeleting ? 'Deleting...' : 'Delete video'}
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      {/* Video Stats Overlay */}
      {showActions && (
        <div className="absolute bottom-2 left-2 z-20 bg-black bg-opacity-75 text-white px-3 py-1 rounded-md text-sm">
          {video._count?.ratings || 0} ratings
        </div>
      )}

      <VideoCard video={video} onVideoUpdate={onVideoUpdate} />

      {/* Deleting Overlay */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 rounded-lg">
          <div className="flex flex-col items-center text-white">
            <div className="h-8 w-8 animate-spin border-3 border-white border-t-transparent rounded-full mb-2" />
            <p className="text-sm font-medium">Deleting...</p>
          </div>
        </div>
      )}
    </div>
  )
}