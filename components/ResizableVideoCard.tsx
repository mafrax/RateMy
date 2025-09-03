'use client'

import { useState, useRef, useEffect } from 'react'
import { Resizable } from 're-resizable'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import { StarIcon } from '@heroicons/react/24/solid'
import { 
  StarIcon as StarOutlineIcon, 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { AddTagInput } from './AddTagInput'
import { CommentSection } from './CommentSection'
import { NSFWBlurOverlay } from './NSFWBlurOverlay'
import { useNSFW } from '@/contexts/NSFWContext'

interface Video {
  id: string
  title: string
  embedUrl: string
  originalUrl: string
  thumbnail?: string
  description?: string
  isNsfw: boolean
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

interface ResizableVideoCardProps {
  video: Video
  onVideoUpdate?: () => void
  onResize?: (width: number, height: number, videoId: string) => void
  onDragStart?: (e: React.DragEvent, videoId: string) => void
  onDragEnd?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, targetVideoId: string) => void
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  gridPosition?: { row: number; col: number }
  isDragging?: boolean
  isDropTarget?: boolean
}

export function ResizableVideoCard({ 
  video, 
  onVideoUpdate, 
  onResize,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  defaultWidth = 400,
  defaultHeight = 480,
  minWidth = 300,
  minHeight = 350,
  maxWidth = 1200,
  maxHeight = 1200,
  gridPosition,
  isDragging = false,
  isDropTarget = false
}: ResizableVideoCardProps) {
  const { data: session } = useSession()
  const { globalBlurEnabled, isVideoRevealed, revealVideo } = useNSFW()
  const [isRating, setIsRating] = useState(false)
  const [localTags, setLocalTags] = useState(video.tags)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  
  // Resizable state
  const [cardSize, setCardSize] = useState({ width: defaultWidth, height: defaultHeight })
  const [isResizing, setIsResizing] = useState(false)
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (isResizing) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', video.id)
    if (onDragStart) {
      onDragStart(e, video.id)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isResizing) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (onDragOver) {
      onDragOver(e)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (isResizing) return
    if (onDragLeave) {
      onDragLeave(e)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (isResizing) return
    e.preventDefault()
    e.stopPropagation()
    console.log('ResizableVideoCard handleDrop called for:', video.id) // Debug log
    if (onDrop) {
      onDrop(e, video.id)
    }
  }
  
  const cardRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Sync local tags when video prop changes
  useEffect(() => {
    setLocalTags(video.tags)
  }, [video.tags])

  // Sync card size when default dimensions change
  useEffect(() => {
    setCardSize({ width: defaultWidth, height: defaultHeight })
  }, [defaultWidth, defaultHeight])

  const getAverageRating = (tagId: string) => {
    if (!video.ratings || !Array.isArray(video.ratings)) return 0
    const tagRatings = video.ratings.filter(r => r.tag.id === tagId)
    if (tagRatings.length === 0) return 0
    return tagRatings.reduce((sum, r) => sum + r.level, 0) / tagRatings.length
  }

  const getUserRating = (tagId: string) => {
    if (!session || !video.ratings || !Array.isArray(video.ratings)) return 0
    const userRating = video.ratings.find(r => r.tag.id === tagId && r.user?.id === (session.user as any)?.id)
    return userRating ? userRating.level : 0
  }

  const handleRate = async (tagId: string, level: number) => {
    if (!session) {
      toast.error('Please sign in to rate videos')
      return
    }

    setIsRating(true)
    try {
      const payload = { tagId, level }
      const response = await fetch(`/api/videos/${video.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Rating submitted!')
        if (onVideoUpdate) {
          onVideoUpdate()
        }
      } else {
        toast.error(data.message || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    } finally {
      setIsRating(false)
    }
  }

  const handleAddTag = async (tagName: string) => {
    if (!session) {
      toast.error('Please sign in to add tags')
      return
    }

    try {
      const response = await fetch(`/api/videos/${video.id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagName }),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Tag added!')
        if (onVideoUpdate) {
          onVideoUpdate()
        }
      } else {
        toast.error(data.message || 'Failed to add tag')
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error('Failed to add tag')
    }
  }

  const handleResizeStart = () => {
    setIsResizing(true)
  }

  const handleResize = (e: MouseEvent | TouchEvent, direction: any, ref: HTMLElement) => {
    const newWidth = ref.offsetWidth
    const newHeight = ref.offsetHeight
    
    setCardSize({ width: newWidth, height: newHeight })
    
    if (onResize) {
      onResize(newWidth, newHeight, video.id)
    }
  }

  const handleResizeStop = () => {
    setIsResizing(false)
  }

  const openModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'auto'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const displayName = video.user.firstName && video.user.lastName 
    ? `${video.user.firstName} ${video.user.lastName}`
    : video.user.username

  // Calculate iframe dimensions based on card size
  const videoAspectRatio = 16 / 9
  const maxVideoWidth = cardSize.width - 32 // Account for padding
  const maxVideoHeight = (cardSize.height * 0.6) // Use 60% of card height for video
  
  let videoWidth = maxVideoWidth
  let videoHeight = videoWidth / videoAspectRatio
  
  if (videoHeight > maxVideoHeight) {
    videoHeight = maxVideoHeight
    videoWidth = videoHeight * videoAspectRatio
  }

  const shouldBlur = video.isNsfw && globalBlurEnabled && !isVideoRevealed(video.id)

  return (
    <>
      <div
        draggable={!isResizing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative transition-all duration-200 ${
          isDragging 
            ? 'opacity-50 scale-95 rotate-1 z-50 cursor-grabbing' 
            : isDropTarget
              ? 'scale-105 shadow-2xl ring-2 ring-blue-400 bg-blue-50 z-40'
              : isResizing 
                ? 'z-50' 
                : 'z-10 hover:scale-102 cursor-grab'
        }`}
      >
        <Resizable
          size={cardSize}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          minWidth={minWidth}
          minHeight={minHeight}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          enable={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
          handleStyles={{
            top: { height: '8px', top: '-4px' },
            right: { width: '8px', right: '-4px' },
            bottom: { height: '8px', bottom: '-4px' },
            left: { width: '8px', left: '-4px' },
            topRight: { width: '12px', height: '12px', top: '-6px', right: '-6px' },
            bottomRight: { width: '12px', height: '12px', bottom: '-6px', right: '-6px' },
            bottomLeft: { width: '12px', height: '12px', bottom: '-6px', left: '-6px' },
            topLeft: { width: '12px', height: '12px', top: '-6px', left: '-6px' }
          }}
          handleClasses={{
            top: 'resize-handle resize-handle-top',
            right: 'resize-handle resize-handle-right',
            bottom: 'resize-handle resize-handle-bottom',
            left: 'resize-handle resize-handle-left',
            topRight: 'resize-handle resize-handle-corner',
            bottomRight: 'resize-handle resize-handle-corner',
            bottomLeft: 'resize-handle resize-handle-corner',
            topLeft: 'resize-handle resize-handle-corner'
          }}
        >
        <div
          ref={cardRef}
          className={`
            h-full w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg 
            border border-gray-200 dark:border-gray-700 
            transition-all duration-200 overflow-hidden
            ${isResizing ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50' : 'hover:shadow-xl'}
          `}
          data-testid="video-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {/* Drag Handle */}
              <div 
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Drag to reorder"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                </svg>
              </div>
              
              <Link 
                href={`/profile/${video.user.id}`}
                className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {displayName}
              </Link>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(video.createdAt)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={openModal}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Expand to fullscreen"
                aria-label="Expand video to fullscreen"
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Video Section */}
          <div className="p-4">
            <div className="relative mb-3" style={{ height: videoHeight }}>
              {shouldBlur ? (
                <NSFWBlurOverlay onReveal={() => revealVideo(video.id)}>
                  <iframe
                    ref={iframeRef}
                    src={video.embedUrl}
                    title={video.title}
                    className="w-full h-full rounded-md"
                    style={{ width: videoWidth, height: videoHeight, margin: '0 auto', display: 'block' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </NSFWBlurOverlay>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={video.embedUrl}
                  title={video.title}
                  className="w-full h-full rounded-md"
                  style={{ width: videoWidth, height: videoHeight, margin: '0 auto', display: 'block' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {video.title}
            </h3>

            {/* Description */}
            {video.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {video.description}
              </p>
            )}

            {/* Tags and Ratings */}
            <div className="space-y-2">
              {localTags.slice(0, tagsExpanded ? localTags.length : 3).map(({ tag }) => {
                const averageRating = getAverageRating(tag.id)
                const userRating = getUserRating(tag.id)

                return (
                  <div key={tag.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
                    <div className="flex items-center space-x-1">
                      {/* User Rating */}
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            onClick={() => handleRate(tag.id, level)}
                            disabled={isRating}
                            className={`p-0.5 rounded transition-colors ${
                              level <= userRating
                                ? 'text-blue-500'
                                : 'text-gray-300 dark:text-gray-600 hover:text-blue-400'
                            } ${isRating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={`Rate ${tag.name} ${level} stars`}
                          >
                            {level <= userRating ? (
                              <StarIcon className="h-3 w-3" />
                            ) : (
                              <StarOutlineIcon className="h-3 w-3" />
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {/* Average Rating */}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}

              {localTags.length > 3 && (
                <button
                  onClick={() => setTagsExpanded(!tagsExpanded)}
                  className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {tagsExpanded ? (
                    <>
                      <ChevronUpIcon className="h-4 w-4" />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-4 w-4" />
                      <span>Show {localTags.length - 3} more</span>
                    </>
                  )}
                </button>
              )}

              {/* Add Tag Input */}
              {session && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <AddTagInput onAddTag={handleAddTag} />
                </div>
              )}
            </div>

            {/* Comments Toggle */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <Bars3Icon className="h-4 w-4" />
                <span>{isCommentsExpanded ? 'Hide' : 'Show'} Comments</span>
                <span className="bg-gray-200 dark:bg-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {commentCount}
                </span>
              </button>
            </div>

            {/* Comments Section */}
            {isCommentsExpanded && (
              <div className="mt-3">
                <CommentSection videoId={video.id} onCommentCountChange={setCommentCount} />
              </div>
            )}
          </div>
        </div>
        </Resizable>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <>
          {createPortal(
            <div 
              className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
              onClick={closeModal}
            >
              <div 
                className="relative max-w-6xl max-h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">
                    {video.title}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                             hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4">
                  <div className="aspect-video max-w-4xl mx-auto">
                    <iframe
                      src={video.embedUrl}
                      title={video.title}
                      className="w-full h-full rounded-md"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  
                  {video.description && (
                    <div className="mt-4 max-w-4xl mx-auto">
                      <p className="text-gray-600 dark:text-gray-400">{video.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* Resize Handle Styles */}
      <style jsx global>{`
        .resize-handle {
          @apply bg-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-200;
        }
        
        .resize-handle-top,
        .resize-handle-bottom {
          @apply cursor-ns-resize;
        }
        
        .resize-handle-left,
        .resize-handle-right {
          @apply cursor-ew-resize;
        }
        
        .resize-handle-corner {
          @apply cursor-nw-resize bg-blue-600 rounded-full;
        }
        
        .resize-handle-corner::after {
          content: '';
          @apply absolute inset-0 bg-white rounded-full transform scale-50;
        }
        
        .resizable-container:hover .resize-handle {
          @apply opacity-60;
        }
        
        .resizable-container.resizing .resize-handle {
          @apply opacity-100;
        }
      `}</style>
    </>
  )
}