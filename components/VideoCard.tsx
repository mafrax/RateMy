'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon, XMarkIcon, ArrowsPointingOutIcon, Bars3Icon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { AddTagInput } from './AddTagInput'
import { CommentSection } from './CommentSection'

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
  onVideoUpdate?: () => void
}

export function VideoCard({ video, onVideoUpdate }: VideoCardProps) {
  const { data: session } = useSession()
  const [isRating, setIsRating] = useState(false)
  const [localTags, setLocalTags] = useState(video.tags)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalVideoHeight, setModalVideoHeight] = useState(400)
  const [modalVideoPosition, setModalVideoPosition] = useState({ left: 0, top: 0, width: 0 })
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Sync local tags when video prop changes
  useEffect(() => {
    setLocalTags(video.tags)
  }, [video.tags])

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
      console.log('Submitting rating:', payload, 'for video:', video.id)
      
      const response = await fetch(`/api/videos/${video.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Rating submission failed:', response.status, errorText)
        throw new Error(`Failed to rate video: ${response.status} ${errorText}`)
      }

      toast.success('Rating submitted!')
      
      // Refresh video data to get updated ratings
      if (onVideoUpdate) {
        onVideoUpdate()
      }
    } catch (error) {
      console.error('Rating error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating')
    } finally {
      setIsRating(false)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!session) {
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

      // Remove tag from local state immediately
      setLocalTags(prev => prev.filter(videoTag => videoTag.tag.id !== tagId))
      
      toast.success('Tag removed successfully!')
      
      // Call parent update if provided
      if (onVideoUpdate) {
        onVideoUpdate()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove tag')
    }
  }

  const handleTagAdded = (newTag: { id: string; name: string }) => {
    // Add tag to local state immediately
    setLocalTags(prev => [...prev, { tag: newTag }])
    
    // Call parent update if provided
    if (onVideoUpdate) {
      onVideoUpdate()
    }
  }

  const handleCommentsExpandedChange = (expanded: boolean, count: number) => {
    setIsCommentsExpanded(expanded)
    setCommentCount(count)
  }

  const calculateModalHeight = () => {
    const titleHeight = 60 // Title header height
    const videoAreaHeight = modalVideoHeight + 32 // Video height + padding
    const commentHeaderHeight = 48 // Comment header (always present)
    
    let dynamicCommentHeight = 0
    if (isCommentsExpanded) {
      // Add space for expanded comments
      const commentFormHeight = session ? 80 : 0 // Add comment form (if signed in)
      const commentsHeight = Math.min(commentCount * 70, 280) // Max 4 comments visible (70px each)
      const commentPadding = 24 // Bottom padding
      dynamicCommentHeight = commentFormHeight + commentsHeight + commentPadding
    }
    
    return titleHeight + videoAreaHeight + commentHeaderHeight + dynamicCommentHeight
  }


  const handleDetach = () => {
    if (!iframeRef.current || !cardRef.current) return
    
    // Get the current position and size of the video
    const rect = iframeRef.current.getBoundingClientRect()
    
    // Set the iframe to fixed position at its current location
    const iframe = iframeRef.current
    iframe.style.position = 'fixed'
    iframe.style.top = `${rect.top}px`
    iframe.style.left = `${rect.left}px`
    iframe.style.width = `${rect.width}px`
    iframe.style.height = `${rect.height}px`
    iframe.style.zIndex = '9999'
    iframe.style.transition = 'all 0.3s ease-in-out'
    
    // Open modal
    setIsModalOpen(true)
    
    // After a short delay, animate to center and enlarge
    setTimeout(() => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate target size - leave space for the side panel (320px + gap)
      const panelWidth = 320
      const gap = 24 // Gap between video and panel
      const totalPanelSpace = panelWidth + gap
      const availableWidth = viewportWidth - totalPanelSpace - 64 // 64px for margins
      const targetWidth = Math.min(availableWidth, 800)
      const targetHeight = targetWidth * (9/16) // 16:9 aspect ratio
      
      // Center the combined card (video + panel) in the viewport
      const cardWidth = targetWidth + totalPanelSpace
      const baseCardHeight = targetHeight + 168 // Base space for title, padding, and collapsed comments
      const leftOffset = (viewportWidth - cardWidth) / 2
      const topOffset = (viewportHeight - baseCardHeight) / 2
      
      // Position iframe within the card - accounting for card padding and title
      const iframeLeft = leftOffset + 16 // Card padding
      const iframeTop = topOffset + 60 + 16 // Title height + card padding
      
      iframe.style.left = `${iframeLeft}px`
      iframe.style.top = `${iframeTop}px`
      iframe.style.width = `${targetWidth}px`
      iframe.style.height = `${targetHeight}px`
      
      // Store the video dimensions and position for the card layout
      setModalVideoHeight(targetHeight)
      setModalVideoPosition({ left: leftOffset, top: topOffset, width: targetWidth })
    }, 50)
  }

  const handleCloseModal = () => {
    if (!iframeRef.current || !cardRef.current) return
    
    // Get the original position
    const cardRect = cardRef.current.getBoundingClientRect()
    const cardVideoContainer = cardRef.current.querySelector('.aspect-video') as HTMLElement
    const containerRect = cardVideoContainer?.getBoundingClientRect()
    
    if (containerRect) {
      const iframe = iframeRef.current
      
      // Animate back to original position
      iframe.style.left = `${containerRect.left}px`
      iframe.style.top = `${containerRect.top}px`
      iframe.style.width = `${containerRect.width}px`
      iframe.style.height = `${containerRect.height}px`
      
      // After animation, reset to normal positioning
      setTimeout(() => {
        iframe.style.position = 'static'
        iframe.style.top = 'auto'
        iframe.style.left = 'auto'
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.zIndex = 'auto'
        iframe.style.transition = ''
        setIsModalOpen(false)
      }, 300)
    } else {
      setIsModalOpen(false)
    }
  }

  // Handle ESC key to close modal and manage body scroll
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        handleCloseModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])


  const renderStars = (tagId: string) => {
    const userRating = getUserRating(tagId)
    const avgRating = getAverageRating(tagId)
    
    return [...Array(5)].map((_, i) => {
      const starIndex = i + 1
      const userFilled = starIndex <= userRating
      const avgFilled = starIndex <= Math.round(avgRating)
      
      return (
        <button
          key={i}
          onClick={() => handleRate(tagId, starIndex)}
          disabled={isRating || !session}
          className="relative text-yellow-400 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 disabled:opacity-50 transition-colors"
          title={session ? `Your rating: ${userRating}/5, Average: ${avgRating.toFixed(1)}/5` : `Average: ${avgRating.toFixed(1)}/5`}
        >
          {/* User rating star (more prominent) */}
          {session && userFilled && (
            <StarIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          )}
          
          {/* Average rating star (background) */}
          {(!session || !userFilled) && avgFilled && (
            <StarIcon className="h-4 w-4" />
          )}
          
          {/* Empty star outline */}
          {(!avgFilled || (session && !userFilled && !avgFilled)) && (
            <StarOutlineIcon className="h-4 w-4" />
          )}
          
          {/* User rating outline overlay when user hasn't rated but avg is filled */}
          {session && !userFilled && avgFilled && (
            <StarOutlineIcon className="absolute inset-0 h-4 w-4 text-blue-300 dark:text-blue-500 opacity-60" />
          )}
        </button>
      )
    })
  }


  return (
    <>
      <div 
        className="card hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow relative group flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        ref={cardRef}
      >
        {/* Control buttons */}
        <div className="absolute top-2 right-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Drag handle */}
          <div
            className="p-2 bg-black dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 text-white rounded-full cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-4 w-4" />
          </div>
          
          {/* Detach button */}
          <button
            onClick={handleDetach}
            className="p-2 bg-black dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 hover:bg-opacity-70 dark:hover:bg-opacity-90 text-white rounded-full transition-all"
            title="Open in modal"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Video Area */}
        {video.originalUrl?.includes('redgifs.com') ? (
          <div id={`video-container-${video.id}`} className="relative mb-3" style={{ height: '189px' }}>
            <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
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
            </div>
          </div>
        ) : (
          <div className="aspect-video mb-4 flex-shrink-0">
            <iframe
              ref={iframeRef}
              src={video.embedUrl}
              title={video.title}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        )}
      
      {/* Scrollable Info Panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 pr-1">
          <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Link href={`/videos/${video.id}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {video.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            by {video.user.firstName || video.user.username}
          </p>
        </div>

        {video.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {video.description}
          </p>
        )}

        <div className="space-y-2">
          {localTags && Array.isArray(localTags) && (() => {
            const tagsToShow = tagsExpanded ? localTags : localTags.slice(0, 3)
            const hasMoreTags = localTags.length > 3
            
            return (
              <>
                {tagsToShow.map(({ tag }) => {
                  const avgRating = getAverageRating(tag.id)
                  return (
                    <div key={tag.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {tag.name}
                        </span>
                        {session && (
                          <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            title="Remove tag"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(tag.id)}
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {session && getUserRating(tag.id) > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-blue-600 dark:text-blue-400">You: {getUserRating(tag.id)}/5</span>
                              <span>Avg: {avgRating.toFixed(1)}/5</span>
                            </div>
                          ) : (
                            <span>Avg: {avgRating.toFixed(1)}/5</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {hasMoreTags && (
                  <button
                    onClick={() => setTagsExpanded(!tagsExpanded)}
                    className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mt-2"
                  >
                    {tagsExpanded ? (
                      <>
                        <ChevronUpIcon className="h-3 w-3" />
                        <span>Show less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDownIcon className="h-3 w-3" />
                        <span>Show {localTags.length - 3} more tags</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )
          })()}
          
          {session && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <AddTagInput 
                videoId={video.id} 
                onTagAdded={handleTagAdded}
                className="w-full"
              />
            </div>
          )}
        </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span>{video._count?.ratings || 0} ratings</span>
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Comment Section */}
          <CommentSection videoId={video.id} />
        </div>
      </div>

      </div>

      {/* Modal Backdrop and Card Container */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 z-50"
          onClick={(e) => {
            // Close modal when clicking the backdrop (but not the card)
            if (e.target === e.currentTarget) {
              handleCloseModal()
            }
          }}
        >
          {/* Card Container with Video and Info Panel */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl dark:shadow-gray-900/50 overflow-hidden fixed flex flex-col transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-700"
            style={{
              left: `${modalVideoPosition.left}px`,
              top: `${modalVideoPosition.top}px`,
              width: `${modalVideoPosition.width + 24 + 320}px`, // Video width + gap + panel width
              height: `${calculateModalHeight()}px` // Dynamic height - grows downward only
            }}
          >
            {/* Card Header with Title and Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <Link 
                href={`/videos/${video.id}`}
                className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate flex-1 mr-4 transition-colors"
                title="View video page"
              >
                {video.title}
              </Link>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                title="Close modal"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Fixed Content Area - Video and Info Panel Side by Side */}
            <div 
              className="flex p-4 gap-6"
              style={{ height: `${modalVideoHeight + 32}px` }} // Fixed height for video + padding
            >
              {/* Video Container - positioned where the iframe will be */}
              <div 
                className="flex-shrink-0 rounded-lg overflow-hidden"
                style={{
                  width: `${modalVideoPosition.width}px`,
                  height: `${modalVideoHeight}px`
                }}
              >
                {/* The iframe will be positioned over this space */}
              </div>

              {/* Info Panel */}
              <div className="w-80 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by {video.user.firstName || video.user.username}
                    </p>
                  </div>

                  {video.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {video.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Tags & Ratings</h4>
                    <div className="space-y-2">
                      {localTags && Array.isArray(localTags) && (() => {
                        const tagsToShow = tagsExpanded ? localTags : localTags.slice(0, 3)
                        const hasMoreTags = localTags.length > 3
                        
                        return (
                          <>
                            {tagsToShow.map(({ tag }) => {
                              const avgRating = getAverageRating(tag.id)
                              return (
                                <div key={tag.id} className="flex items-center justify-between group">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {tag.name}
                                    </span>
                                    {session && (
                                      <button
                                        onClick={() => handleRemoveTag(tag.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                        title="Remove tag"
                                      >
                                        <XMarkIcon className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {renderStars(tag.id)}
                                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      {session && getUserRating(tag.id) > 0 ? (
                                        <div className="flex flex-col items-end">
                                          <span className="text-blue-600 dark:text-blue-400">You: {getUserRating(tag.id)}/5</span>
                                          <span>Avg: {avgRating.toFixed(1)}/5</span>
                                        </div>
                                      ) : (
                                        <span>Avg: {avgRating.toFixed(1)}/5</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            
                            {hasMoreTags && (
                              <button
                                onClick={() => setTagsExpanded(!tagsExpanded)}
                                className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mt-2"
                              >
                                {tagsExpanded ? (
                                  <>
                                    <ChevronUpIcon className="h-3 w-3" />
                                    <span>Show less</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDownIcon className="h-3 w-3" />
                                    <span>Show {localTags.length - 3} more tags</span>
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        )
                      })()}
                      
                      {session && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <AddTagInput 
                            videoId={video.id} 
                            onTagAdded={handleTagAdded}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>{video._count?.ratings || 0} ratings</span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Comment Section at Bottom */}
            <div className="transition-all duration-300 ease-in-out">
              <CommentSection 
                videoId={video.id} 
                onExpandedChange={handleCommentsExpandedChange}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}