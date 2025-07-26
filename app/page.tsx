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
  sortBy: 'createdAt' | 'title' | 'ratings'
  sortOrder: 'desc' | 'asc'
  page: number
  limit: number
}

export default function HomePage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters)
  }

  return (
    <div className="space-y-8">
      <HeroSection />
      <SearchBar onSearch={handleSearch} />
      <VideoGrid searchFilters={searchFilters} />
    </div>
  )
}