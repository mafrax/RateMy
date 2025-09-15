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
import { extractXHamsterPreview, VideoPreviewData } from '@/src/services/video-preview.service'

interface Video {
  id: string
  title: string
  embedUrl: string
  originalUrl: string
  thumbnail?: string
  previewUrl?: string
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
  gridPosition,
  isDragging = false,
  isDropTarget = false
}: ResizableVideoCardProps) {
  const { data: session } = useSession()
  const { globalBlurEnabled, isVideoRevealed, revealVideo, toggleVideoReveal } = useNSFW()
  const { setCachedRating, getCachedRating, hasPendingRating } = useRatingCache()
  const [isRating, setIsRating] = useState(false)
  const [localTags, setLocalTags] = useState(video.tags)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Resizable state
  const [cardSize, setCardSize] = useState({ width: defaultWidth, height: defaultHeight })
  const [isResizing, setIsResizing] = useState(false)

  // Modal resizable state
  const [modalSize, setModalSize] = useState({ width: 1200, height: 800 })
  const [isModalResizing, setIsModalResizing] = useState(false)

  // Video orientation state
  const [isVerticalVideo, setIsVerticalVideo] = useState(false)
  const videoElementRef = useRef<HTMLVideoElement>(null)
  const iframeElementRef = useRef<HTMLIFrameElement>(null)
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // Resizable divider state for horizontal videos
  const [videoSectionHeight, setVideoSectionHeight] = useState(0.4) // Default to 40%
  const [isDraggingDivider, setIsDraggingDivider] = useState(false)

  // Hover preview state for horizontal videos
  const [isHovering, setIsHovering] = useState(false)
  const [previewData, setPreviewData] = useState<VideoPreviewData | null>(() => ({
    previewUrl: video.previewUrl || undefined,
    thumbnailUrl: video.thumbnail || undefined
  }))
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [showIframe, setShowIframe] = useState(false) // Controls if iframe is revealed
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isNoDrag, setIsNoDrag] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest(".infosection")) {
    // mark that dragging should be disabled
    setIsNoDrag(true)
  } else {
    setIsNoDrag(false)
  }
}


  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    console.log("=== CLICK DEBUG ===");
    console.log("event.target:", target);
    console.log("target.className:", target.className);

    // walk up the DOM tree and log each ancestor
    let el: HTMLElement | null = target;
    while (el) {
      console.log(" →", el.tagName, el.className);
      el = el.parentElement;
    }

    console.log("closest .infosection:", target.closest(".infosection"));
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
  if (isResizing || isNoDrag) {
    e.preventDefault()
    return
  }

    // Check if the drag started from a no-drag element
    const target = e.target as HTMLElement
    const noDragElement = target.closest(".infosection")
        // const noDragElement = target.closest('[data-no-drag="true"]')
    console.log('event.target:', e.target);
    console.log("event.currentTarget:", e.currentTarget);
    console.log(noDragElement)
    console.log(target.closest)
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

  // Sync local tags when video prop changes and sort by average rating
  useEffect(() => {
    const sortedTags = [...video.tags].sort((a, b) => {
      const avgRatingA = getAverageRating(a.tag.id)
      const avgRatingB = getAverageRating(b.tag.id)
      return avgRatingB - avgRatingA // Highest to lowest
    })
    setLocalTags(sortedTags)
  }, [video.tags, video.ratings])

  // Sync card size when default dimensions change
  useEffect(() => {
    setCardSize({ width: defaultWidth, height: defaultHeight })
  }, [defaultWidth, defaultHeight])

  // Removed automatic rating saved callback to prevent unwanted page refreshes
  // Ratings are now handled seamlessly through the cache without full page reloads

  // Detect video orientation and aspect ratio
  useEffect(() => {
    const detectVideoOrientation = () => {
      if (video.originalUrl?.includes('redgifs.com') || video.embedUrl?.includes('redgifs.com')) {
        // For RedGifs iframe URLs, assume vertical orientation for now
        if (video.embedUrl?.includes('/ifr/')) {
          setIsVerticalVideo(true)
          setVideoAspectRatio(9 / 16)
        } else {
          // For direct RedGifs video URLs, we need to wait for the video element to load
          const videoElement = videoElementRef.current
          if (videoElement) {
            const checkDimensions = () => {
              if (videoElement.videoWidth && videoElement.videoHeight) {
                const isVertical = videoElement.videoHeight > videoElement.videoWidth
                const aspectRatio = videoElement.videoWidth / videoElement.videoHeight
                setIsVerticalVideo(isVertical)
                setVideoAspectRatio(aspectRatio)
              }
            }

            // Check when metadata is loaded
            videoElement.addEventListener('loadedmetadata', checkDimensions)
            
            // Also check if already loaded
            if (videoElement.readyState >= 1) {
              checkDimensions()
            }

            return () => {
              videoElement.removeEventListener('loadedmetadata', checkDimensions)
            }
          }
        }
      } else {
        // For other videos, try to infer from URL or use heuristics
        // Most RedGifs, TikTok, Instagram Reels, YouTube Shorts are typically vertical
        const url = video.originalUrl?.toLowerCase() || ''
        const isLikelyVertical = url.includes('tiktok') || 
                                url.includes('instagram') || 
                                url.includes('shorts') ||
                                (url.includes('youtube') && url.includes('shorts'))
        setIsVerticalVideo(isLikelyVertical)
        // Set default aspect ratios based on orientation
        setVideoAspectRatio(isLikelyVertical ? (9 / 16) : (16 / 9))
      }
    }

    detectVideoOrientation()
  }, [video.originalUrl, video.embedUrl])


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
        // Removed onVideoUpdate call to prevent page refresh
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

      // Removed video refresh to prevent page reload

    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error((error as Error).message || 'Failed to delete video')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Handle add comment button click
  const handleAddComment = () => {
    if (!isCommentsExpanded) {
      setIsCommentsExpanded(true)
    }
    setIsAddingComment(true)
  }

  // Handle divider dragging for horizontal videos
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingDivider(true)
    
    const startY = e.clientY
    const startRatio = videoSectionHeight
    const cardHeight = cardSize.height
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const ratioChange = deltaY / cardHeight
      const newRatio = Math.min(0.8, Math.max(0.2, startRatio + ratioChange)) // Constrain between 20% and 80%
      setVideoSectionHeight(newRatio)
    }
    
    const handleMouseUp = () => {
      setIsDraggingDivider(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle hover preview for horizontal videos (video-card-type-2)
  const handleVideoHoverEnter = async () => {
    console.log('🎯 Hover enter triggered')
    console.log('🎯 isVerticalVideo:', isVerticalVideo)
    console.log('🎯 originalUrl:', video.originalUrl)
    console.log('🎯 includes xhamster:', video.originalUrl?.includes('xhamster.com'))
    
    // Only for horizontal videos (video-card-type-2) and XHamster videos
    if (isVerticalVideo || !video.originalUrl?.includes('xhamster.com')) {
      console.log('🎯 Skipping preview - not horizontal XHamster video')
      return
    }

    console.log('🎯 Setting hovering to true')
    setIsHovering(true)

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Delay preview loading to avoid loading on quick hovers - only if we don't have previewUrl yet
    if (!previewData?.previewUrl && !isLoadingPreview) {
      hoverTimeoutRef.current = setTimeout(async () => {
        console.log('🎯 Starting preview load after timeout')
        setIsLoadingPreview(true)
        try {
          const data = await extractXHamsterPreview(video.originalUrl, video.id)
          console.log('🎯 Preview data received:', data)
          setPreviewData(data)
        } catch (error) {
          console.error('🎯 Failed to load preview:', error)
        } finally {
          setIsLoadingPreview(false)
        }
      }, 300) // 300ms delay before loading preview
    } else {
      console.log('🎯 Preview data already exists, skipping API call')
    }
  }

  const handleVideoHoverLeave = () => {
    setIsHovering(false)
    
    // Clear timeout if user leaves before preview loads
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  const handleVideoClick = () => {
    // Clicking reveals the iframe and hides the thumbnail/preview
    setShowIframe(true)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])



  // Calculate video dimensions based on card size and video orientation with fixed info width
  const getVideoDimensions = () => {
    if (isVerticalVideo) {
      // For vertical videos in horizontal layout - fixed info section width
      const headerHeight = 60 // Approximate header height
      const padding = 32 // Total padding
      const availableHeight = cardSize.height - headerHeight - padding
      
      // Fixed info section width (doesn't change with resize)
      const fixedInfoWidth = 200 // Further increased width for info section to prevent overlap
      
      // Available width for video section
      const availableVideoWidth = cardSize.width - fixedInfoWidth - 24 // Reduced padding for tighter layout
      
      // Use actual aspect ratio if available, fallback to 9:16
      const aspectRatio = videoAspectRatio || (9 / 16)
      
      // Calculate video dimensions maintaining aspect ratio - much larger for natural sizing
      // Start with height-constrained approach for vertical videos to maximize video area
      let videoHeight = Math.max(300, Math.min(availableHeight * 0.9, 800)) // Use 90% of available height, up to 800px
      let videoWidth = videoHeight * aspectRatio
      
      // If width exceeds available space, constrain by width
      if (videoWidth > availableVideoWidth) {
        videoWidth = Math.max(180, Math.min(availableVideoWidth * 0.95, 450)) // Use 95% of available width, up to 450px
        videoHeight = videoWidth / aspectRatio
      }
      
      // Ensure video uses maximum possible space while maintaining aspect ratio
      const maxVideoWidth = availableVideoWidth * 0.95
      const maxVideoHeight = availableHeight * 0.9
      
      // Final optimization - use the largest possible dimensions
      const widthConstrainedHeight = maxVideoWidth / aspectRatio
      const heightConstrainedWidth = maxVideoHeight * aspectRatio
      
      if (widthConstrainedHeight <= maxVideoHeight) {
        // Width is the limiting factor
        videoWidth = maxVideoWidth
        videoHeight = widthConstrainedHeight
      } else {
        // Height is the limiting factor  
        videoHeight = maxVideoHeight
        videoWidth = heightConstrainedWidth
      }
      
      return { 
        width: videoWidth, 
        height: videoHeight,
        infoWidth: fixedInfoWidth // Fixed width for info section
      }
    } else {
      // For horizontal videos in vertical layout - maximize video area
      const aspectRatio = videoAspectRatio || (16 / 9)
      const maxVideoWidth = cardSize.width - 40 // Account for padding
      const maxVideoHeight = (cardSize.height * videoSectionHeight) // Use dynamic height ratio for video section

      // Try to use maximum width first
      let videoWidth = maxVideoWidth
      let videoHeight = videoWidth / aspectRatio

      // If height is too much, constrain by height
      if (videoHeight > maxVideoHeight) {
        videoHeight = maxVideoHeight
        videoWidth = videoHeight * aspectRatio
      }
      
      // Ensure we're using as much space as possible
      videoWidth = Math.min(videoWidth, maxVideoWidth)
      videoHeight = Math.min(videoHeight, maxVideoHeight)
      
      return { width: videoWidth, height: videoHeight }
    }
  }

  const videoDimensions = getVideoDimensions()
  const { width: videoWidth, height: videoHeight } = videoDimensions
  const infoWidth = videoDimensions.infoWidth

  const shouldBlur = video.isNsfw && globalBlurEnabled && !isVideoRevealed(video.id)



  return (
    <>
      {/* Wrapper container to maintain layout when card is expanded via portal */}
      <div
        className="relative"
        style={{
          width: cardSize.width,
          height: cardSize.height
        }}
      >
        <div
          ref={cardRef}
          id={isVerticalVideo ? `vertical-video-card-${video.id}` : `horizontal-video-card-${video.id}`}
          draggable={!isResizing}
          onMouseDown={handleMouseDown}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={` ${isVerticalVideo ? 'video-card-type-1' :  'video-card-type-2'} relative transition-all duration-200 ${isDragging
            ? 'opacity-50 scale-95 rotate-1 z-50 cursor-grabbing'
            : isDropTarget
              ? 'scale-105 shadow-2xl ring-2 ring-blue-400 bg-blue-50 z-40'
              : isResizing
                ? 'z-50'
                : ''
            }`}
          // style={{border : '2px solid red'}}
        >
        <Resizable
          size={cardSize}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          minWidth={minWidth}
          minHeight={minHeight}
          maxWidth={maxWidth}
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
            top: { height: '12px', top: '-6px' },
            right: { width: '12px', right: '-6px' },
            bottom: { height: '12px', bottom: '-6px' },
            left: { width: '12px', left: '-6px' },
            topRight: { width: '24px', height: '24px', top: '-12px', right: '-12px' },
            bottomRight: { width: '24px', height: '24px', bottom: '-12px', right: '-12px' },
            bottomLeft: { width: '24px', height: '24px', bottom: '-12px', left: '-12px' },
            topLeft: { width: '24px', height: '24px', top: '-12px', left: '-12px' }
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
            <div className="video-card-header flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-grab">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* Drag Handle */}
                <div
                  className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                  title="Drag to reorder"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" />
                  </svg>
                </div>

                {/* Video Title */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate" title={video.title}>
                    {video.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <Link
                      href={`/profile/${video.user.id}`}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      {displayName}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(video.createdAt)}
                    </span>
                  </div>
                </div>
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

            {/* Main Content Area */}
            <div className={`flex ${isVerticalVideo ? 'flex-row' : 'flex-col'} h-full`}>
                {/* Video Section */}
                <div className={`videoSection ${isVerticalVideo ? 'flex-grow' : ''} flex flex-col ${isVerticalVideo ? '' : 'mb-4'}`} style={{ minHeight: 0, height: isVerticalVideo ? 'auto' : `${videoHeight + 60}px` }}>
                  <div 
                    id={`video-section-${video.id}`} 
                    className={`flex-1 p-4 ${isVerticalVideo ? 'pb-8' : 'pb-6'} relative`} 
                    style={{ minHeight: 0 }}
                    onMouseEnter={handleVideoHoverEnter}
                    onMouseLeave={handleVideoHoverLeave}
                  >
                    {(video.originalUrl?.includes('redgifs.com') || video.embedUrl?.includes('redgifs.com')) && !video.embedUrl?.includes('/ifr/') ? (
                      <div ref={videoContainerRef} id={`video-container-${video.id}`} className="w-full" style={{ 
                        minHeight: 200,
                        height: isVerticalVideo ? `calc(100% - 2rem)` : `${videoHeight}px`
                      }}>
                        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-md overflow-hidden" style={{ minHeight: 200 }}>
                          {shouldBlur ? (
                            <NSFWBlurOverlay
                              isNSFW={video.isNsfw}
                              onReveal={() => revealVideo(video.id)}
                            >
                              <video
                                ref={videoElementRef}
                                src={video.embedUrl}
                                className="w-full h-full rounded-md object-contain"
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                              />
                            </NSFWBlurOverlay>
                          ) : (
                            <video
                              ref={videoElementRef}
                              src={video.embedUrl}
                              className="w-full h-full rounded-md object-contain"
                              controls
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div ref={videoContainerRef} id={`video-container-${video.id}`} className="w-full relative" style={{ 
                        minHeight: 200,
                        height: isVerticalVideo ? `calc(100% - 2rem)` : `${videoHeight}px`
                      }}>
                        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-md overflow-hidden relative" style={{ minHeight: 200 }}>
                          {showIframe ? (
                            // Show iframe when clicked
                            shouldBlur ? (
                              <NSFWBlurOverlay
                                isNSFW={video.isNsfw}
                                onReveal={() => revealVideo(video.id)}
                              >
                                <iframe
                                  ref={iframeElementRef}
                                  src={video.embedUrl}
                                  title={video.title}
                                  className="w-full h-full rounded-md"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </NSFWBlurOverlay>
                            ) : (
                              <iframe
                                ref={iframeElementRef}
                                src={video.embedUrl}
                                title={video.title}
                                className="w-full h-full rounded-md"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )
                          ) : (
                            // Show thumbnail/preview overlay by default
                            shouldBlur ? (
                              <NSFWBlurOverlay
                                isNSFW={video.isNsfw}
                                onReveal={() => revealVideo(video.id)}
                                className="w-full h-full"
                              >
                                <div 
                                  className="w-full h-full bg-gray-900 rounded-md flex items-center justify-center cursor-pointer relative"
                                  onClick={handleVideoClick}
                                >
                                  {/* Thumbnail Image */}
                                  {previewData?.thumbnailUrl ? (
                                    <img
                                      src={previewData.thumbnailUrl}
                                      alt={video.title}
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="text-white text-sm opacity-75">Click to load video</div>
                                  )}
                                  
                                  {/* Play Button Overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black bg-opacity-50 rounded-full p-4 transition-opacity hover:bg-opacity-70">
                                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                  
                                  {/* Hover Preview Video Overlay - Only for horizontal XHamster videos */}
                                  {!isVerticalVideo && isHovering && previewData?.previewUrl && (
                                    <div className="absolute inset-0 z-10 bg-black bg-opacity-80 flex items-center justify-center rounded-md">
                                      <video
                                        src={previewData.previewUrl}
                                        className="max-w-full max-h-full object-contain rounded"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        style={{ maxWidth: '90%', maxHeight: '90%' }}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Loading indicator for preview */}
                                  {!isVerticalVideo && isHovering && isLoadingPreview && (
                                    <div className="absolute inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                                      <div className="text-white text-sm">Loading preview...</div>
                                    </div>
                                  )}
                                </div>
                              </NSFWBlurOverlay>
                            ) : (
                              <div 
                                className="w-full h-full bg-gray-900 rounded-md flex items-center justify-center cursor-pointer relative"
                                onClick={handleVideoClick}
                              >
                                {/* Thumbnail Image */}
                                {previewData?.thumbnailUrl ? (
                                  <img
                                    src={previewData.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="text-white text-sm opacity-75">Click to load video</div>
                                )}
                                
                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black bg-opacity-50 rounded-full p-4 transition-opacity hover:bg-opacity-70">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                                
                                {/* Hover Preview Video Overlay - Only for horizontal XHamster videos */}
                                {!isVerticalVideo && isHovering && previewData?.previewUrl && (
                                  <div className="absolute inset-0 z-10 bg-black bg-opacity-80 flex items-center justify-center rounded-md">
                                    <video
                                      src={previewData.previewUrl}
                                      className="max-w-full max-h-full object-contain rounded"
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      style={{ maxWidth: '90%', maxHeight: '90%' }}
                                    />
                                  </div>
                                )}
                                
                                {/* Loading indicator for preview */}
                                {!isVerticalVideo && isHovering && isLoadingPreview && (
                                  <div className="absolute inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                                    <div className="text-white text-sm">Loading preview...</div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resizable Divider for horizontal videos */}
                {!isVerticalVideo && (
                  <div 
                    className={`divider-handle w-full h-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-row-resize transition-colors flex items-center justify-center relative ${isDraggingDivider ? 'bg-blue-400 dark:bg-blue-500' : ''}`}
                    onMouseDown={handleDividerMouseDown}
                    title="Drag to resize video/info sections"
                  >
                    <div className="w-8 h-1 bg-white dark:bg-gray-300 rounded-full opacity-60"></div>
                  </div>
                )}

                {/* Info Section */}
                <div 
                  className={`infosection ${isVerticalVideo ? 'ml-2 flex-shrink-0 flex flex-col' : 'flex-1'}`}
                  style={isVerticalVideo ? { 
                    width: infoWidth,
                    minWidth: infoWidth,
                    maxWidth: infoWidth,
                    minHeight: 0
                  } : {
                    height: `${cardSize.height * (1 - videoSectionHeight) - 8}px`, // Remaining height minus divider
                    maxHeight: `${cardSize.height * (1 - videoSectionHeight) - 8}px`,
                    overflow: 'hidden'
                  }}
                >

                  <div 
                    className={`${isVerticalVideo ? 'px-2 pb-2 flex-1 flex flex-col' : 'px-4 pb-4 h-full flex flex-col'}`}
                    style={isVerticalVideo ? { minHeight: 0, height: '100%' } : { minHeight: 0 }}
                  >
                    {/* Collapsed vertical layout - only tags and notes */}
                    {isVerticalVideo ? (
                      <div className="verticalTagSection flex flex-col h-full" style={{ minHeight: 0 }}>
                        {/* Tags Section - Full height scrollable */}
                        <div className="overflow-y-auto custom-scrollbar" style={{ 
                          height: `${Math.max(200, cardSize.height - 150)}px`,
                          minHeight: 0
                        }}>
                          <div className="space-y-1.5 pb-8">

                       {/* Notes section at the bottom */}
                            {video.description && (
                              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md p-2 mt-2">
                                <div className="text-[9px] font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
                                  Description
                                </div>
                                <div className="text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {video.description}
                                </div>
                              </div>
                            )}

                            {localTags.map(({ tag }) => {
                              const averageRating = getAverageRating(tag.id)
                              const userRating = getUserRating(tag.id)
                              const isPending = hasPendingRating(video.id, tag.id)
                              
                              return (
                                <div key={tag.id} className="verticalTagBubble bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-1.5 shadow-sm">
                                  {/* Tag name */}
                                  <div className="mb-1">
                                    <span 
                                      className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight block text-center" 
                                      title={tag.name}
                                    >
                                      {tag.name}
                                    </span>
                                  </div>
                                  
                                  <TagWithSlider
                                    tag={tag}
                                    userRating={userRating}
                                    avgRating={averageRating}
                                    isPending={isPending}
                                    onRate={handleRate}
                                    disabled={isRating || !session}
                                    canRemove={false}
                                    compact={true}
                                  />
                                  
                                  {/* Rating values display */}
                                  <div className="mt-1 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-medium text-red-600 dark:text-red-400">
                                        Avg: {averageRating.toFixed(1)}
                                      </span>
                                      {userRating > 0 && (
                                        <span className={`text-[9px] font-medium ${isPending ? 'text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                          You: {userRating.toFixed(1)}{isPending && '*'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            
                            {/* Add Tag Button for vertical layout */}
                            {session && (
                              <div className="mt-2">
                                <AddTagInput 
                                  videoId={video.id} 
                                  onTagAdded={(tag) => {
                                    // Removed onVideoUpdate to prevent page refresh
                                  }}
                                  compact={true}
                                />
                              </div>
                            )}
                            
     
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>

                        {/* NSFW Status and Controls - Ultra compact */}
                        <div className="mb-1 space-y-1">
                          {video.isNsfw && (
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                NSFW
                              </span>
                              {session?.user && (
                                <button
                                  onClick={handleNSFWToggle}
                                  className="p-0.5 rounded transition-colors text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Mark as Safe"
                                >
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1.5L12 4.5L9 1.5L3 7V9H21ZM12 10C10.9 10 10 10.9 10 12S10.9 14 12 14S14 13.1 14 12S13.1 10 12 10ZM6 10V12H8V10H6ZM16 10V12H18V10H16ZM4 18V20H8V18H4ZM10 18V20H14V18H10ZM16 18V20H20V18H16Z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                          
                          {!video.isNsfw && session?.user && (
                            <div className="flex justify-end">
                              <button
                                onClick={handleNSFWToggle}
                                className="p-0.5 rounded transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                title="Mark as NSFW"
                              >
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1.5L12 4.5L9 1.5L3 7V9H21ZM12 10C10.9 10 10 10.9 10 12S10.9 14 12 14S14 13.1 14 12S13.1 10 12 10ZM6 10V12H8V10H6ZM16 10V12H18V10H16ZM4 18V20H8V18H4ZM10 18V20H14V18H10ZM16 18V20H20V18H16Z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* NSFW Video Control - Compact vertical layout
                        {video.isNsfw && (
                          <div id={`nsfw-warning-${video.id}`} className="mb-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-2 space-y-1">
                            <div id={`nsfw-text-${video.id}`} className="text-xs text-amber-700 dark:text-amber-300 text-center">
                              <span className="font-medium">NSFW Content</span>
                            </div>
                            <button
                              id={`nsfw-toggle-${video.id}`}
                              onClick={() => toggleVideoReveal(video.id)}
                              className="w-full text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                            >
                              {isVideoRevealed(video.id) ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        )} */}

                        {/* Description */}
                        {video.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {video.description}
                          </p>
                        )}

                        {/* Tags Section - Scrollable */}
                        <div
                          className="overflow-y-auto custom-scrollbar flex-1"
                          style={{ minHeight: 0 }}
                        >
                          <div className="space-y-2 pr-2 pb-8">
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
                                <AddTagInput videoId={video.id} onTagAdded={(tag) => {
                                // Removed onVideoUpdate to prevent page refresh
                              }} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="commentSection">
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                              >
                                <Bars3Icon className="h-4 w-4" />
                                <span>{isCommentsExpanded ? 'Hide' : 'Show'} Comments</span>
                                <span className="bg-gray-200 dark:bg-gray-600 text-xs px-2 py-0.5 rounded-full ml-2">
                                  {commentCount}
                                </span>
                              </button>
                              
                              <button
                                onClick={handleAddComment}
                                className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Add comment"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add</span>
                              </button>
                            </div>
                            <CommentSection 
                              videoId={video.id} 
                              onExpandedChange={(expanded, count) => setCommentCount(count)}
                              isAddingComment={isAddingComment}
                              onCommentAdded={() => setIsAddingComment(false)}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

          </div>
        </Resizable>
        </div>
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
                  top: { height: '12px', top: '-6px', backgroundColor: '#3B82F6' },
                  right: { width: '12px', right: '-6px', backgroundColor: '#3B82F6' },
                  bottom: { height: '12px', bottom: '-6px', backgroundColor: '#3B82F6' },
                  left: { width: '12px', left: '-6px', backgroundColor: '#3B82F6' },
                  topRight: { width: '24px', height: '24px', top: '-12px', right: '-12px', backgroundColor: '#2563EB', borderRadius: '50%' },
                  bottomRight: { width: '24px', height: '24px', bottom: '-12px', right: '-12px', backgroundColor: '#2563EB', borderRadius: '50%' },
                  bottomLeft: { width: '24px', height: '24px', bottom: '-12px', left: '-12px', backgroundColor: '#2563EB', borderRadius: '50%' },
                  topLeft: { width: '24px', height: '24px', top: '-12px', left: '-12px', backgroundColor: '#2563EB', borderRadius: '50%' }
                }}
              >
                <div
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden h-full transition-all duration-200 ${isModalResizing ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
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
                          className={`p-1.5 rounded-full transition-colors ${video.isNsfw
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
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1.5L12 4.5L9 1.5L3 7V9H21ZM12 10C10.9 10 10 10.9 10 12S10.9 14 12 14S14 13.1 14 12S13.1 10 12 10ZM6 10V12H8V10H6ZM16 10V12H18V10H16ZM4 18V20H8V18H4ZM10 18V20H14V18H10ZM16 18V20H20V18H16Z" />
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

                  {/* Modal Content - Adaptive Layout */}
                  <div className={`flex ${isVerticalVideo ? 'flex-row' : 'flex-col lg:flex-row'} h-full overflow-hidden`}>
                    {/* Video Column */}
                    <div className={`${isVerticalVideo ? 'flex-shrink-0' : 'flex-1'} p-6 overflow-y-auto`}>
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
                      {(video.originalUrl?.includes('redgifs.com') || video.embedUrl?.includes('redgifs.com')) && !video.embedUrl?.includes('/ifr/') ? (
                        <div className="relative mb-3" style={{ 
                          width: isVerticalVideo ? Math.min(450, modalSize.width * 0.5) : '100%',
                          height: isVerticalVideo ? 'auto' : Math.min(400, modalSize.height * 0.6)
                        }}>
                          <div className={`${isVerticalVideo ? 'aspect-[9/16]' : 'aspect-video'} bg-gray-200 rounded-md flex items-center justify-center`}>
                            {shouldBlur ? (
                              <NSFWBlurOverlay
                                isNSFW={video.isNsfw}
                                onReveal={() => revealVideo(video.id)}
                              >
                                <video
                                  src={video.embedUrl}
                                  className="w-full h-full rounded-md object-contain"
                                  controls
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              </NSFWBlurOverlay>
                            ) : (
                              <video
                                src={video.embedUrl}
                                className="w-full h-full rounded-md object-contain"
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="relative bg-black rounded-lg overflow-hidden" style={{ 
                          aspectRatio: isVerticalVideo ? '9/16' : '16/9',
                          width: isVerticalVideo ? Math.min(450, modalSize.width * 0.5) : '100%',
                          height: isVerticalVideo ? 'auto' : Math.min(400, modalSize.height * 0.6)
                        }}>
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
                      )}
                    </div>

                    {/* Info Column - Tags, Ratings, and Comments */}
                    <div className={`${isVerticalVideo ? 'flex-1' : 'w-80'} border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto`}>
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
                            <AddTagInput videoId={video.id} onTagAdded={(tag) => {
                              // Removed onVideoUpdate to prevent page refresh
                            }} />
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
                          <CommentSection videoId={video.id} onExpandedChange={(expanded, count) => setCommentCount(count)} />
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
        
        /* Custom scrollbar styles for vertical tag section */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
          border: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </>
  )
}