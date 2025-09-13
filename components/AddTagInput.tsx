'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface AddTagInputProps {
  videoId: string
  onTagAdded: (tag: { id: string; name: string }) => void
  className?: string
  compact?: boolean
}

export function AddTagInput({ videoId, onTagAdded, className = '', compact = false }: AddTagInputProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [tagName, setTagName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('Please sign in to add tags')
      return
    }

    if (!tagName.trim()) {
      toast.error('Please enter a tag name')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/videos/${videoId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tagName: tagName.trim()
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add tag')
      }

      const result = await response.json()
      
      toast.success('Tag added successfully!')
      setTagName('')
      setIsOpen(false)
      
      // Pass the created/found tag back to parent
      onTagAdded({ 
        id: result.data?.tag?.id || result.tagId, 
        name: tagName.trim().toLowerCase() 
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setTagName('')
    setIsOpen(false)
  }

  if (!session) {
    return null
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center ${compact ? 'justify-center w-full p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs' : 'space-x-1 text-sm text-blue-600 hover:text-blue-700'} ${className}`}
      >
        <PlusIcon className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
        {!compact && <span>Add Tag</span>}
        {compact && <span className="ml-1 text-xs">Add</span>}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'} ${className}`}>
      <input
        type="text"
        value={tagName}
        onChange={(e) => setTagName(e.target.value)}
        placeholder="Enter tag name..."
        className={`flex-1 min-w-0 ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'} border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
        maxLength={50}
        autoFocus
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting || !tagName.trim()}
        className={`${compact ? 'p-0.5' : 'p-1'} text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Add tag"
      >
        <PlusIcon className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isSubmitting}
        className={`${compact ? 'p-0.5' : 'p-1'} text-gray-400 hover:text-gray-600 disabled:opacity-50`}
        title="Cancel"
      >
        <XMarkIcon className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
    </form>
  )
}