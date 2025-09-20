'use client'

import { useState } from 'react'
import { VideoGrid } from '@/components/VideoGrid'
import { SearchBar } from '@/components/SearchBar'
import { HeroSection } from '@/components/HeroSection'

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

export default function HomePage() {
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
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroSection />
        <SearchBar onSearch={handleSearch} />
      </div>
      <VideoGrid 
        searchFilters={searchFilters} 
        includeNsfw={searchFilters?.includeNsfw ?? true}
        onIncludeNsfwChange={handleIncludeNsfwChange}
      />
    </div>
  )
}