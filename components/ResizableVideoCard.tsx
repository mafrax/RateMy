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
import { TagWithSlider } from './TagWithSlider'
import toast from 'react-hot-toast'
import { AddTagInput } from './AddTagInput'
import { CommentSection } from './CommentSection'
import { NSFWBlurOverlay } from './NSFWBlurOverlay'
import { useNSFW } from '@/contexts/NSFWContext'
import { ConfirmDialog } from './ConfirmDialog'
import { useRatingCache } from '@/contexts/RatingCacheContext'

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
  onResizeStart?: (videoId: string) => void
  onResizeStop?: (width: number, height: number, videoId: string) => void
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
  onResizeStart,
  onResizeStop,
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
  const { globalBlurEnabled, isVideoRevealed, revealVideo, toggleVideoReveal } = useNSFW()
  const { setCachedRating, getCachedRating, hasPendingRating, addRatingSavedCallback, removeRatingSavedCallback } = useRatingCache()
  const [isRating, setIsRating] = useState(false)
  const [localTags, setLocalTags] = useState(video.tags)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Resizable state
  const [cardSize, setCardSize] = useState({ width: defaultWidth, height: defaultHeight })
  const [isResizing, setIsResizing] = useState(false)
  
  // Modal resizable state
  const [modalSize, setModalSize] = useState({ width: 1200, height: 800 })
  const [isModalResizing, setIsModalResizing] = useState(false)
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (isResizing) {
      e.preventDefault()
      return
    }
    
    // Check if the drag started from a no-drag element
    const target = e.target as HTMLElement
    const noDragElement = target.closest('[data-no-drag="true"]')
    if (noDragElement) {
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

  // NSFW marking functionality
  const handleNSFWToggle = async () => {
    if (!session?.user) {
      toast.error('You must be logged in to mark videos')
      return
    }

    try {
      const newNSFWStatus = !video.isNsfw
      
      const response = await fetch(`/api/videos/${video.id}/nsfw`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isNSFW: newNSFWStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update NSFW status')
      }

      // Update local state - this will trigger a re-render
      video.isNsfw = newNSFWStatus
      
      toast.success(`Video marked as ${newNSFWStatus ? 'NSFW' : 'safe'}`)
      
      // Force a re-render by calling onResize (this will trigger parent re-render)
      if (onResize) {
        onResize(cardSize.width, cardSize.height, video.id)
      }

    } catch (error) {
      console.error('Error updating NSFW status:', error)
      toast.error('Failed to update video status')
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

  // Set up rating saved callback to trigger video refresh
  useEffect(() => {
    const handleRatingSaved = () => {
      if (onVideoUpdate) {
        onVideoUpdate()
      }
    }
    
    addRatingSavedCallback(video.id, handleRatingSaved)
    
    return () => {
      removeRatingSavedCallback(video.id)
    }
  }, [video.id, onVideoUpdate, addRatingSavedCallback, removeRatingSavedCallback])


  const getAverageRating = (tagId: string) => {
    if (!video.ratings || !Array.isArray(video.ratings)) return 0
    const tagRatings = video.ratings.filter(r => r.tag.id === tagId)
    if (tagRatings.length === 0) return 0
    return tagRatings.reduce((sum, r) => sum + r.level, 0) / tagRatings.length
  }

  const getUserRating = (tagId: string) => {
    if (!session || !video.ratings || !Array.isArray(video.ratings)) return 0
    
    // Check if there's a cached rating first
    const cachedRating = getCachedRating(video.id, tagId)
    if (cachedRating !== null) return cachedRating
    
    // Fall back to saved rating from database
    const userRating = video.ratings.find(r => r.tag.id === tagId && r.user?.id === (session.user as any)?.id)
    return userRating ? userRating.level : 0
  }

  const handleRate = async (tagId: string, level: number) => {
    if (!session) {
      toast.error('Please sign in to rate videos')
      return
    }

    // Immediately cache the rating for instant UI feedback
    setCachedRating(video.id, tagId, level)
    
    // Show toast to indicate rating was cached
    toast.success('Rating saved! Will sync to server shortly.')
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
    if (onResizeStart) {
      onResizeStart(video.id)
    }
  }

  const handleResize = (e: MouseEvent | TouchEvent, direction: any, ref: HTMLElement) => {
    const newWidth = ref.offsetWidth
    const newHeight = ref.offsetHeight
    
    setCardSize({ width: newWidth, height: newHeight })
    
    if (onResize) {
      onResize(newWidth, newHeight, video.id)
    }
  }

  const handleResizeStop = (e: MouseEvent | TouchEvent, direction: any, ref: HTMLElement) => {
    setIsResizing(false)
    const finalWidth = ref.offsetWidth
    const finalHeight = ref.offsetHeight
    
    setCardSize({ width: finalWidth, height: finalHeight })
    
    if (onResizeStop) {
      onResizeStop(finalWidth, finalHeight, video.id)
    }
  }

  const openModal = () => {
    // Set initial modal size based on viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const initialWidth = Math.min(1200, viewportWidth * 0.9)
    const initialHeight = Math.min(800, viewportHeight * 0.9)
    
    setModalSize({ width: initialWidth, height: initialHeight })
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

  // Check if current user can delete this video
  const canDelete = session?.user && (
    (session.user as any).id === video.user.id || // Owner can delete
    (session.user as any).isAdmin === true // Admin can delete any video
  )
  
  const isAdmin = session?.user && (session.user as any).isAdmin === true
  const isOwner = session?.user && (session.user as any).id === video.user.id

  // Handle video deletion
  const handleDeleteVideo = async () => {
    if (!session?.user) {
      toast.error('You must be logged in to delete videos')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to delete video')
      }

      toast.success('Video deleted successfully')
      
      // Close modal if open
      if (isModalOpen) {
        closeModal()
      }
      
      // Trigger refresh of video list
      if (onVideoUpdate) {
        onVideoUpdate()
      }

    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error((error as Error).message || 'Failed to delete video')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }


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
        id={`video-card-${video.id}`}
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
          <div className="video-card-header flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
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
              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 
                           hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isAdmin && !isOwner ? 'Delete video (Admin)' : 'Delete your video'}
                  aria-label="Delete video"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              
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
          <div id={`video-section-${video.id}`} className="p-4">
            <div id={`video-container-${video.id}`} className="relative mb-3" style={{ height: videoHeight }}>
              {shouldBlur ? (
                <NSFWBlurOverlay 
                  isNSFW={video.isNsfw}
                  onReveal={() => revealVideo(video.id)}
                >
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
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 pr-2">
                {video.title}
              </h3>
              
              {/* NSFW Status and Controls */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {video.isNsfw && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    NSFW
                  </span>
                )}
                
                {session?.user && (
                  <button
                    onClick={handleNSFWToggle}
                    className={`p-1 rounded-full transition-colors ${
                      video.isNsfw 
                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={video.isNsfw ? 'Mark as Safe' : 'Mark as NSFW'}
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1.5L12 4.5L9 1.5L3 7V9H21ZM12 10C10.9 10 10 10.9 10 12S10.9 14 12 14S14 13.1 14 12S13.1 10 12 10ZM6 10V12H8V10H6ZM16 10V12H18V10H16ZM4 18V20H8V18H4ZM10 18V20H14V18H10ZM16 18V20H20V18H16Z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* NSFW Video Control */}
            {video.isNsfw && (
              <div id={`nsfw-warning-${video.id}`} className="mb-2 flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div id={`nsfw-text-${video.id}`} className="text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-medium">This content is marked as NSFW</span>
                </div>
                <button
                  id={`nsfw-toggle-${video.id}`}
                  onClick={() => toggleVideoReveal(video.id)}
                  className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                >
                  {isVideoRevealed(video.id) ? 'Hide NSFW' : 'Show NSFW'}
                </button>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {video.description}
              </p>
            )}

            {/* Tags Section - Scrollable */}
            <div 
              className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              style={{ height: `${Math.max(120, cardSize.height - videoHeight - 200)}px` }}
            >
              <div className="space-y-2 pr-2">
                {localTags.map(({ tag }) => {
                  const averageRating = getAverageRating(tag.id)
                  const userRating = getUserRating(tag.id)
                  const isPending = hasPendingRating(video.id, tag.id)

                  return (
                    <TagWithSlider
                      key={tag.id}
                      tag={tag}
                      userRating={userRating}
                      avgRating={averageRating}
                      isPending={isPending}
                      onRate={handleRate}
                      disabled={isRating || !session}
                      canRemove={false}
                    />
                  )
                })}

                {/* Add Tag Input */}
                {session && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <AddTagInput onAddTag={handleAddTag} />
                  </div>
                )}

                {/* Comments Toggle */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 w-full"
                  >
                    <Bars3Icon className="h-4 w-4" />
                    <span>{isCommentsExpanded ? 'Hide' : 'Show'} Comments</span>
                    <span className="bg-gray-200 dark:bg-gray-600 text-xs px-2 py-0.5 rounded-full ml-auto">
                      {commentCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Resizable>
      </div>

      {/* Enhanced Resizable Modal */}
      {isModalOpen && (
        <>
          {createPortal(
            <div 
              className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
              onClick={closeModal}
            >
              <Resizable
                size={modalSize}
                onResizeStart={() => setIsModalResizing(true)}
                onResize={(e, direction, ref) => {
                  setModalSize({ width: ref.offsetWidth, height: ref.offsetHeight })
                }}
                onResizeStop={() => setIsModalResizing(false)}
                minWidth={800}
                minHeight={600}
                maxWidth={window.innerWidth - 100}
                maxHeight={window.innerHeight - 100}
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
                  top: { height: '8px', top: '-4px', backgroundColor: '#3B82F6' },
                  right: { width: '8px', right: '-4px', backgroundColor: '#3B82F6' },
                  bottom: { height: '8px', bottom: '-4px', backgroundColor: '#3B82F6' },
                  left: { width: '8px', left: '-4px', backgroundColor: '#3B82F6' },
                  topRight: { width: '12px', height: '12px', top: '-6px', right: '-6px', backgroundColor: '#2563EB', borderRadius: '50%' },
                  bottomRight: { width: '12px', height: '12px', bottom: '-6px', right: '-6px', backgroundColor: '#2563EB', borderRadius: '50%' },
                  bottomLeft: { width: '12px', height: '12px', bottom: '-6px', left: '-6px', backgroundColor: '#2563EB', borderRadius: '50%' },
                  topLeft: { width: '12px', height: '12px', top: '-6px', left: '-6px', backgroundColor: '#2563EB', borderRadius: '50%' }
                }}
              >
                <div 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden h-full transition-all duration-200 ${
                    isModalResizing ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/profile/${video.user.id}`}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {displayName}
                        </Link>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(video.createdAt)}
                        </span>
                      </div>
                      
                      {/* NSFW Badge in header */}
                      {video.isNsfw && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          NSFW
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* NSFW Toggle in header */}
                      {session?.user && (
                        <button
                          onClick={handleNSFWToggle}
                          className={`p-1.5 rounded-full transition-colors ${
                            video.isNsfw 
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          title={video.isNsfw ? 'Mark as Safe' : 'Mark as NSFW'}
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1.5L12 4.5L9 1.5L3 7V9H21ZM12 10C10.9 10 10 10.9 10 12S10.9 14 12 14S14 13.1 14 12S13.1 10 12 10ZM6 10V12H8V10H6ZM16 10V12H18V10H16ZM4 18V20H8V18H4ZM10 18V20H14V18H10ZM16 18V20H20V18H16Z"/>
                          </svg>
                        </button>
                      )}
                      
                      {/* Delete button in modal header */}
                      {canDelete && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isDeleting}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 
                                   hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isAdmin && !isOwner ? 'Delete video (Admin)' : 'Delete your video'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      
                      <button
                        onClick={closeModal}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Close modal"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content - Two Column Layout */}
                  <div className="flex h-full overflow-hidden">
                    {/* Left Column - Video and Title */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      {/* Video Title */}
                      <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {video.title}
                        </h1>
                        {video.description && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {video.description}
                          </p>
                        )}
                      </div>

                      {/* NSFW Warning for modal */}
                      {video.isNsfw && (
                        <div className="mb-4 flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="text-sm text-amber-700 dark:text-amber-300">
                            <span className="font-medium">This content is marked as NSFW</span>
                          </div>
                          <button
                            onClick={() => toggleVideoReveal(video.id)}
                            className="text-sm px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                          >
                            {isVideoRevealed(video.id) ? 'Hide NSFW' : 'Show NSFW'}
                          </button>
                        </div>
                      )}
                      
                      {/* Video Player */}
                      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        {shouldBlur ? (
                          <NSFWBlurOverlay 
                            isNSFW={video.isNsfw}
                            onReveal={() => revealVideo(video.id)}
                          >
                            <iframe
                              src={video.embedUrl}
                              title={video.title}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </NSFWBlurOverlay>
                        ) : (
                          <iframe
                            src={video.embedUrl}
                            title={video.title}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>

                    {/* Right Column - Tags, Ratings, and Comments */}
                    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                      <div className="p-6 space-y-6">
                        {/* Tags and Ratings */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags & Ratings</h3>
                          <div className="space-y-3">
                            {localTags.slice(0, tagsExpanded ? localTags.length : 5).map(({ tag }) => {
                              const averageRating = getAverageRating(tag.id)
                              const userRating = getUserRating(tag.id)
                              const isPending = hasPendingRating(video.id, tag.id)

                              return (
                                <TagWithSlider
                                  key={tag.id}
                                  tag={tag}
                                  userRating={userRating}
                                  avgRating={averageRating}
                                  isPending={isPending}
                                  onRate={handleRate}
                                  disabled={isRating || !session}
                                  canRemove={false}
                                />
                              )
                            })}

                            {localTags.length > 5 && (
                              <button
                                onClick={() => setTagsExpanded(!tagsExpanded)}
                                className="w-full flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-2"
                              >
                                {tagsExpanded ? (
                                  <>
                                    <ChevronUpIcon className="h-4 w-4" />
                                    <span>Show less</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDownIcon className="h-4 w-4" />
                                    <span>Show {localTags.length - 5} more</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Add Tag */}
                        {session && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Add Tag</h4>
                            <AddTagInput onAddTag={handleAddTag} />
                          </div>
                        )}

                        {/* Comments */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
                            <span className="bg-gray-200 dark:bg-gray-600 text-xs px-2 py-1 rounded-full">
                              {commentCount}
                            </span>
                          </div>
                          <CommentSection videoId={video.id} onCommentCountChange={setCommentCount} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Resizable>
            </div>,
            document.body
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Video"
        message={`Are you sure you want to delete "${video.title}"? This action cannot be undone.${isAdmin && !isOwner ? '\n\nYou are deleting this video as an administrator.' : ''}`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteVideo}
        onCancel={() => setShowDeleteConfirm(false)}
      />

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