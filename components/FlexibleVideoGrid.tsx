'use client'

import React, { useState, useEffect } from 'react'
import { VideoCard } from './VideoCard'

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

interface FlexibleVideoGridProps {
  videos: Video[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onVideoUpdate?: () => void
}

export function FlexibleVideoGrid({ videos, loading, error, onRetry, onVideoUpdate }: FlexibleVideoGridProps) {
  const [columnsPerRow, setColumnsPerRow] = useState<1 | 2 | 3>(3)
  const [orderedVideos, setOrderedVideos] = useState<Video[]>([])
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)

  // Initialize ordered videos when videos prop changes
  useEffect(() => {
    setOrderedVideos(videos)
  }, [videos])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, videoId: string) => {
    setDraggedItemId(videoId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', videoId)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, videoId: string) => {
    e.preventDefault()
    if (draggedItemId && draggedItemId !== videoId) {
      setDragOverItemId(videoId)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear drag over if we're actually leaving the element
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItemId(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetVideoId: string) => {
    e.preventDefault()
    
    if (!draggedItemId || draggedItemId === targetVideoId) {
      setDraggedItemId(null)
      return
    }

    const draggedIndex = orderedVideos.findIndex(v => v.id === draggedItemId)
    const targetIndex = orderedVideos.findIndex(v => v.id === targetVideoId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null)
      return
    }

    const newOrderedVideos = [...orderedVideos]
    const [draggedItem] = newOrderedVideos.splice(draggedIndex, 1)
    newOrderedVideos.splice(targetIndex, 0, draggedItem)

    setOrderedVideos(newOrderedVideos)
    setDraggedItemId(null)
    setDragOverItemId(null)
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
    setDragOverItemId(null)
  }

  const resetOrder = () => {
    setOrderedVideos([...videos])
  }

  // Create a preview of the reordered videos for visual feedback
  const getPreviewVideos = () => {
    if (!draggedItemId || !dragOverItemId) {
      return orderedVideos
    }

    const draggedIndex = orderedVideos.findIndex(v => v.id === draggedItemId)
    const targetIndex = orderedVideos.findIndex(v => v.id === dragOverItemId)

    if (draggedIndex === -1 || targetIndex === -1) {
      return orderedVideos
    }

    const previewVideos = [...orderedVideos]
    const [draggedItem] = previewVideos.splice(draggedIndex, 1)
    previewVideos.splice(targetIndex, 0, draggedItem)

    return previewVideos
  }

  const getGridClasses = () => {
    const baseClasses = "grid gap-6"
    const responsiveClasses = "grid-cols-1 md:grid-cols-2"
    
    switch (columnsPerRow) {
      case 1:
        return `${baseClasses} ${responsiveClasses} lg:grid-cols-1`
      case 2:
        return `${baseClasses} ${responsiveClasses} lg:grid-cols-2`
      case 3:
      default:
        return `${baseClasses} ${responsiveClasses} lg:grid-cols-3`
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Layout Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-md cursor-not-allowed"
              title="Reset to original order"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset Order</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Videos per row:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setColumnsPerRow(cols as 1 | 2 | 3)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    columnsPerRow === cols
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={getGridClasses()}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={onRetry}
          className="mt-4 btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No videos found. Be the first to upload one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Layout Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={resetOrder}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors"
            title="Reset to original order"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset Order</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Videos per row:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[1, 2, 3].map((cols) => (
              <button
                key={cols}
                onClick={() => setColumnsPerRow(cols as 1 | 2 | 3)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  columnsPerRow === cols
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div 
        className={`${getGridClasses()} ${draggedItemId ? 'bg-blue-50 bg-opacity-30 rounded-lg p-2' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          // If we're dragging over the grid but not over a specific card, clear the drag over state
          if (e.target === e.currentTarget) {
            setDragOverItemId(null)
          }
        }}
      >
        {getPreviewVideos().map((video, index) => {
          const isBeingDragged = draggedItemId === video.id
          const isDropTarget = dragOverItemId === video.id
          const originalIndex = orderedVideos.findIndex(v => v.id === video.id)
          const hasMovedPosition = draggedItemId && dragOverItemId && index !== originalIndex

          return (
            <div
              key={video.id}
              draggable
              onDragStart={(e) => handleDragStart(e, video.id)}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, video.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, video.id)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-300 ease-in-out transform ${
                isBeingDragged 
                  ? 'opacity-30 scale-95 rotate-2 z-50' 
                  : isDropTarget
                    ? 'scale-105 shadow-xl ring-2 ring-blue-400 ring-opacity-75 bg-blue-50'
                    : hasMovedPosition
                      ? 'scale-102 shadow-md animate-pulse'
                      : draggedItemId 
                        ? 'hover:scale-105 transition-transform duration-200' 
                        : ''
              }`}
              style={{ 
                cursor: isBeingDragged ? 'grabbing' : draggedItemId ? 'grab' : 'grab',
                zIndex: isBeingDragged ? 50 : isDropTarget ? 40 : hasMovedPosition ? 30 : 'auto'
              }}
            >
              <VideoCard video={video} onVideoUpdate={onVideoUpdate} />
            </div>
          )
        })}
      </div>
    </div>
  )
}