'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  MagnifyingGlassIcon, 
  TagIcon, 
  CalendarIcon, 
  StarIcon,
  XMarkIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { useNSFW } from '@/contexts/NSFWContext'
import { DualRangeSlider } from './DualRangeSlider'
import { TagRatingFilter } from './TagRatingFilter'

interface SearchBarProps {
  onSearch?: (filters: SearchFilters) => void
}

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

const sortOptions = [
  { value: 'createdAt', label: 'Most Recent', icon: CalendarIcon, order: 'desc' },
  { value: 'createdAt', label: 'Oldest First', icon: CalendarIcon, order: 'asc' },
  { value: 'title', label: 'Title A-Z', icon: StarIcon, order: 'asc' },
  { value: 'title', label: 'Title Z-A', icon: StarIcon, order: 'desc' },
  { value: 'ratings', label: 'Most Rated', icon: StarIcon, order: 'desc' },
]

export function SearchBar({ onSearch }: SearchBarProps) {
  const { isNSFWBlurred, toggleNSFWBlur } = useNSFW()
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    tags: [],
    tagRatings: [],
    includeNsfw: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  })
  
  const [tagInput, setTagInput] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; _count?: { videos: number } }>>([])
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [filteredTags, setFilteredTags] = useState<Array<{ id: string; name: string; _count?: { videos: number } }>>([])
  const [pendingFilters, setPendingFilters] = useState<SearchFilters | null>(null)

  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Function to load/refresh available tags
  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const result = await response.json()
        setAvailableTags(result.data || [])
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  // Load available tags on component mount
  useEffect(() => {
    loadTags()
  }, [])

  // Listen for tag updates from other parts of the app
  useEffect(() => {
    const handleTagsUpdated = () => {
      loadTags()
    }

    // Listen for custom event when tags are updated
    window.addEventListener('tagsUpdated', handleTagsUpdated)
    return () => window.removeEventListener('tagsUpdated', handleTagsUpdated)
  }, [])

  // Filter tags based on input
  useEffect(() => {
    if (!tagInput.trim()) {
      setFilteredTags(availableTags) // Show all tags when no input
    } else {
      const filtered = availableTags
        .filter(tag => 
          tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !filters.tags.includes(tag.name)
        )
        .slice(0, 50) // Show up to 50 matching tags when searching
      setFilteredTags(filtered)
    }
  }, [tagInput, availableTags, filters.tags])

  // Trigger initial search
  useEffect(() => {
    onSearch?.(filters)
  }, [])

  // Handle pending filters when dragging stops
  useEffect(() => {
    if (pendingFilters) {
      onSearch?.(pendingFilters)
      setPendingFilters(null)
    }
  }, [pendingFilters, onSearch])

  const updateFilters = (newFilters: Partial<SearchFilters>, immediate = false) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    
    if (immediate) {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
      onSearch?.(updated)
    } else {
      // Store pending filters to apply when dragging stops
      setPendingFilters(updated)
    }
  }

  const updateFiltersWithDebounce = (newFilters: Partial<SearchFilters>, delay = 500) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      onSearch?.(updated)
      debounceTimeoutRef.current = null
    }, delay)
  }

  const handleAddTag = (tagName?: string) => {
    const nameToAdd = tagName || tagInput.trim()
    if (nameToAdd && !filters.tags.includes(nameToAdd)) {
      const newTags = [...filters.tags, nameToAdd]
      const newTagRatings = [...filters.tagRatings, {
        tagName: nameToAdd,
        minRating: 1,
        maxRating: 5
      }]
      updateFilters({ 
        tags: newTags,
        tagRatings: newTagRatings
      }, true)
      setTagInput('')
      setShowTagDropdown(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = filters.tags.filter(tag => tag !== tagToRemove)
    const newTagRatings = filters.tagRatings.filter(rating => rating.tagName !== tagToRemove)
    updateFilters({ 
      tags: newTags,
      tagRatings: newTagRatings
    }, true)
  }

  const handleTagRatingChange = (tagName: string, minRating: number, maxRating: number) => {
    const newTagRatings = filters.tagRatings.map(rating => 
      rating.tagName === tagName 
        ? { ...rating, minRating, maxRating }
        : rating
    )
    
    // Only update local state, don't trigger search
    setFilters({ ...filters, tagRatings: newTagRatings })
  }



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(filters)
  }

  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = {
      search: '',
      tags: [],
      tagRatings: [],
      includeNsfw: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 12
    }
    setFilters(clearedFilters)
    setTagInput('')
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    onSearch?.(clearedFilters)
  }

  const hasActiveFilters = filters.tags.length > 0 || filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc'

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Main Search Bar */}
        <form onSubmit={handleSearch} className="p-6">
          <div className={`relative transition-all duration-300 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-transparent focus-within:border-purple-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all duration-200">
              <div className="pl-4">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for amazing videos..."
                value={filters.search}
                onChange={(e) => {
                  const updated = { ...filters, search: e.target.value }
                  setFilters(updated)
                  updateFiltersWithDebounce({ search: e.target.value }, 500)
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 bg-transparent border-0 py-4 px-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 text-lg font-medium"
              />
              <div className="flex items-center space-x-2 pr-4">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    showFilters || hasActiveFilters
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Advanced Filters"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6 animate-in slide-in-from-top-2 duration-300">
              {/* Tags Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <TagIcon className="inline h-4 w-4 mr-2" />
                  Filter by Tags
                </label>
                <div className="relative" ref={tagDropdownRef}>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      placeholder="Search and add tags..."
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value)
                        setShowTagDropdown(true)
                      }}
                      onFocus={() => setShowTagDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (filteredTags.length > 0 && !tagInput.trim()) {
                            handleAddTag(filteredTags[0].name)
                          } else {
                            handleAddTag()
                          }
                        } else if (e.key === 'Escape') {
                          setShowTagDropdown(false)
                        }
                      }}
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag()}
                      className="bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Tag Dropdown */}
                  {showTagDropdown && filteredTags.length > 0 && (
                    <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleAddTag(tag.name)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors duration-200"
                        >
                          <span className="text-gray-900 dark:text-gray-100">{tag.name}</span>
                          {tag._count && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {tag._count.videos} videos
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {filters.tags.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {filters.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    {/* Per-tag rating ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Rating Ranges for Selected Tags
                      </h4>
                      <div className="space-y-3">
                        {filters.tagRatings.map((tagRating) => (
                          <TagRatingFilter
                            key={tagRating.tagName}
                            tagName={tagRating.tagName}
                            minRating={tagRating.minRating}
                            maxRating={tagRating.maxRating}
                            onApply={(tagName, minRating, maxRating) => {
                              // Update the tag rating in filters
                              const newTagRatings = filters.tagRatings.map(rating => 
                                rating.tagName === tagName 
                                  ? { ...rating, minRating, maxRating }
                                  : rating
                              )
                              const updatedFilters = {
                                ...filters,
                                tagRatings: newTagRatings
                              }
                              setFilters(updatedFilters)
                              // Immediately trigger search with updated filters
                              onSearch?.(updatedFilters)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Options */}
              <div>
                {/* Sort By */}
                <div className="relative" ref={sortDropdownRef}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-left flex items-center justify-between hover:border-purple-400 transition-colors duration-200"
                  >
                    <span className="flex items-center">
                      {React.createElement(
                        sortOptions.find(opt => opt.value === filters.sortBy && opt.order === filters.sortOrder)?.icon || CalendarIcon, 
                        { className: "h-4 w-4 mr-2 text-gray-500" }
                      )}
                      {sortOptions.find(opt => opt.value === filters.sortBy && opt.order === filters.sortOrder)?.label || 'Most Recent'}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                      {sortOptions.map((option) => (
                        <button
                          key={`${option.value}-${option.order}`}
                          type="button"
                          onClick={() => {
                            updateFilters({ sortBy: option.value as any, sortOrder: option.order as any }, true)
                            setShowSortDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
                        >
                          <option.icon className="h-4 w-4 mr-2 text-gray-500" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* NSFW Controls */}
              <div id="nsfw-controls">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  NSFW Content Controls
                </label>
                
                {/* Include NSFW Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Include NSFW Content</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Show explicit or adult content in results
                      </p>
                    </div>
                  </div>
                  <button
                    id="nsfw-include-toggle"
                    type="button"
                    onClick={() => updateFilters({ includeNsfw: !filters.includeNsfw }, true)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      filters.includeNsfw 
                        ? 'bg-purple-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        filters.includeNsfw ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Global Blur Toggle */}
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center">
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      <span className="font-medium">Blur All NSFW Content</span>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Globally blur/unblur all NSFW videos on the page
                      </p>
                    </div>
                  </div>
                  <button
                    id="global-nsfw-blur-toggle"
                    type="button"
                    onClick={toggleNSFWBlur}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                      isNSFWBlurred
                        ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-300 dark:hover:bg-amber-700'
                        : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-300 dark:hover:bg-green-700'
                    }`}
                  >
                    {isNSFWBlurred ? (
                      <>
                        <EyeIcon className="h-4 w-4" />
                        <span className="text-sm">Show All</span>
                      </>
                    ) : (
                      <>
                        <EyeSlashIcon className="h-4 w-4" />
                        <span className="text-sm">Blur All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors duration-200"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}