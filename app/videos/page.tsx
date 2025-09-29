'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import VideoGrid from '@/components/VideoGrid'
import SearchBar from '@/components/SearchBar'
import { Video, Tag, VideoFilters } from '@/types'

interface VideosPageData {
  videos: Video[]
  totalVideos: number
  totalPages: number
  currentPage: number
}

export default function VideosPage() {
  const { data: session } = useSession()
  const [videos, setVideos] = useState<Video[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<VideoFilters>({
    search: '',
    tags: [],
    sort: 'newest',
    showNsfw: false
  })

  // Load videos based on current filters and page
  const loadVideos = async (page: number = 1, currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: currentFilters.sort || 'newest'
      })

      if (currentFilters.search) {
        params.append('search', currentFilters.search)
      }

      if (currentFilters.tags && currentFilters.tags.length > 0) {
        params.append('tags', currentFilters.tags.join(','))
      }

      if (!currentFilters.showNsfw) {
        params.append('nsfw', 'false')
      }

      const response = await fetch(`/api/videos?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load videos: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load videos')
      }

      setVideos(data.data || [])
      setCurrentPage(data.pagination?.page || 1)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Error loading videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load videos')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  // Load available tags
  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTags(data.data || [])
        }
      }
    } catch (err) {
      console.error('Error loading tags:', err)
    }
  }

  // Handle search with filters
  const handleSearch = (newFilters: VideoFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    loadVideos(1, newFilters)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadVideos(page, filters)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Load initial data
  useEffect(() => {
    loadVideos(1)
    loadTags()
  }, [])

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
          <SearchBar
            tags={tags}
            onSearch={handleSearch}
            initialFilters={filters}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Videos
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
                <button
                  onClick={() => loadVideos(currentPage)}
                  className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No videos found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filters.search || filters.tags?.length > 0
                ? 'Try adjusting your search criteria'
                : 'Be the first to upload a video!'}
            </p>
            {session && (
              <div className="mt-6">
                <a
                  href="/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Upload Video
                </a>
              </div>
            )}
          </div>
        )}

        {/* Videos Grid */}
        {!loading && !error && videos.length > 0 && (
          <VideoGrid 
            videos={videos}
            loading={loading}
            onPageChange={handlePageChange}
            pagination={{
              currentPage,
              totalPages,
              hasMore: currentPage < totalPages
            }}
          />
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                  currentPage <= 1
                    ? 'border-gray-300 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                } dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i + 1))
                if (pageNum > totalPages || pageNum < 1) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === currentPage
                        ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                  currentPage >= totalPages
                    ? 'border-gray-300 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                } dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}