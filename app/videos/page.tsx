'use client'

import { useState } from 'react'
import { VideoGrid } from '@/components/VideoGrid'
import { SearchBar } from '@/components/SearchBar'

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
  userId?: string
}

export default function VideosPage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters)
  }

  const handleIncludeNsfwChange = (includeNsfw: boolean) => {
    setSearchFilters(prev => prev ? { ...prev, includeNsfw } : { 
      search: '',
      tags: [],
      tagRatings: [],
      includeNsfw,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 12
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            All Videos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and rate videos from the community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Video Grid */}
        <VideoGrid 
          searchFilters={searchFilters} 
          includeNsfw={searchFilters?.includeNsfw ?? true}
          onIncludeNsfwChange={handleIncludeNsfwChange}
        />
      </div>
    </div>
  )
}