'use client'

import { useState, useEffect } from 'react'
import { IntelligentVideoGrid } from './IntelligentVideoGrid'

interface TagRatingFilter {
  tagName: string
  minRating: number
  maxRating: number
}

interface SearchFilters {
  search: string
  tags: string[]
  tagRatings: TagRatingFilter[]
  includeNsfw: boolean
  sortBy: 'createdAt' | 'title' | 'ratings'
  sortOrder: 'desc' | 'asc'
  page: number
  limit: number
}

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

interface VideoGridProps {
  searchFilters?: SearchFilters | null
}

export function VideoGrid({ searchFilters }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [searchFilters])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters from search filters
      const params = new URLSearchParams()
      
      if (searchFilters) {
        if (searchFilters.search) {
          params.append('search', searchFilters.search)
        }
        if (searchFilters.tags.length > 0) {
          searchFilters.tags.forEach(tag => params.append('tags', tag))
        }
        if (searchFilters.tagRatings.length > 0) {
          params.append('tagRatings', JSON.stringify(searchFilters.tagRatings))
        }
        // Add includeNsfw parameter
        params.append('includeNsfw', searchFilters.includeNsfw.toString())
        if (searchFilters.sortBy) {
          params.append('sortBy', searchFilters.sortBy)
        }
        if (searchFilters.sortOrder) {
          params.append('sortOrder', searchFilters.sortOrder)
        }
        if (searchFilters.page) {
          params.append('page', searchFilters.page.toString())
        }
        if (searchFilters.limit) {
          params.append('limit', searchFilters.limit.toString())
        }
      } else {
        // Default to including NSFW when no filters are applied
        params.append('includeNsfw', 'true')
      }
      
      const url = `/api/videos${params.toString() ? `?${params.toString()}` : ''}`
      console.log('Fetching URL:', url) // Debug log
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText) // Debug log
        throw new Error(`Failed to fetch videos: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data) // Debug log
      
      // Handle different response structures
      if (data.success && data.data) {
        setVideos(data.data || [])
      } else if (data.videos) {
        setVideos(data.videos || [])
      } else if (Array.isArray(data)) {
        setVideos(data)
      } else {
        setVideos([])
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <IntelligentVideoGrid 
      videos={videos}
      loading={loading}
      error={error}
      onRetry={fetchVideos}
      onVideoUpdate={fetchVideos}
    />
  )
}