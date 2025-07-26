'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChatBubbleLeftIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

interface CommentSectionProps {
  videoId: string
  className?: string
  onExpandedChange?: (expanded: boolean, commentCount: number) => void
}

export function CommentSection({ videoId, className = '', onExpandedChange }: CommentSectionProps) {
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)

  const loadComments = async () => {
    if (commentsLoaded) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to load comments')
      }
      
      const result = await response.json()
      setComments(result.data?.comments || [])
      setCommentsLoaded(true)
    } catch (error) {
      toast.error('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleExpanded = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    if (newExpanded && !commentsLoaded) {
      loadComments()
    }
    if (onExpandedChange) {
      onExpandedChange(newExpanded, comments.length)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('Please sign in to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.trim()
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add comment')
      }

      const result = await response.json()
      
      // Add new comment to the top of the list
      setComments(prev => {
        const newComments = [result.data.comment, ...prev]
        if (onExpandedChange && isExpanded) {
          onExpandedChange(isExpanded, newComments.length)
        }
        return newComments
      })
      setNewComment('')
      toast.success('Comment added successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/videos/${videoId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete comment')
      }

      // Remove comment from list
      setComments(prev => {
        const newComments = prev.filter(comment => comment.id !== commentId)
        if (onExpandedChange && isExpanded) {
          onExpandedChange(isExpanded, newComments.length)
        }
        return newComments
      })
      toast.success('Comment deleted successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className={`border-t border-gray-200 ${className}`}>
      {/* Comment Header */}
      <button
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Comments ({comments.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Comment Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Add Comment Form */}
          {session && (
            <form onSubmit={handleSubmitComment} className="mb-4">
              <div className="flex space-x-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 min-h-[60px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  maxLength={1000}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Loading comments...</div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="flex space-x-3 group">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {(comment.user.firstName?.[0] || comment.user.username[0]).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user.firstName || comment.user.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      {session && (session.user as any)?.id === comment.user.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                          title="Delete comment"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">
                {session ? 'Be the first to comment!' : 'No comments yet'}
              </div>
            </div>
          )}

          {!session && (
            <div className="text-center py-2">
              <span className="text-xs text-gray-500">
                Sign in to add comments
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}