'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ResizableVideoCard } from './ResizableVideoCard'

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

interface VideoCardData {
  video: Video
  width: number
  height: number
  gridPosition: { row: number; col: number }
  isResizing?: boolean
}

interface IntelligentVideoGridProps {
  videos: Video[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onVideoUpdate?: () => void
  defaultCardsPerRow?: number
  minCardWidth?: number
  maxCardWidth?: number
  minCardHeight?: number
  maxCardHeight?: number
  containerPadding?: number
  cardGap?: number
}

export function IntelligentVideoGrid({
  videos,
  loading,
  error,
  onRetry,
  onVideoUpdate,
  defaultCardsPerRow = 3,
  minCardWidth = 300,
  maxCardWidth = 800,
  minCardHeight = 350,
  maxCardHeight = 900,
  containerPadding = 24,
  cardGap = 24
}: IntelligentVideoGridProps) {
  const [videoCards, setVideoCards] = useState<VideoCardData[]>([])
  const [containerWidth, setContainerWidth] = useState<number>(1200)
  const [gridRows, setGridRows] = useState<VideoCardData[][]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Calculate default card width based on container width
  const calculateDefaultCardWidth = useCallback((containerW: number) => {
    const availableWidth = containerW - (containerPadding * 2) - (cardGap * (defaultCardsPerRow - 1))
    const cardWidth = Math.floor(availableWidth / defaultCardsPerRow)
    return Math.max(minCardWidth, Math.min(cardWidth, maxCardWidth))
  }, [containerPadding, cardGap, defaultCardsPerRow, minCardWidth, maxCardWidth])

  // Initialize video cards with default sizing
  useEffect(() => {
    if (videos.length > 0 && containerWidth > 0) {
      const defaultWidth = calculateDefaultCardWidth(containerWidth)
      const defaultHeight = Math.max(minCardHeight, defaultWidth * 1.2) // 1.2 aspect ratio for cards
      
      const initialCards: VideoCardData[] = videos.map((video, index) => ({
        video,
        width: defaultWidth,
        height: defaultHeight,
        gridPosition: {
          row: Math.floor(index / defaultCardsPerRow),
          col: index % defaultCardsPerRow
        }
      }))

      setVideoCards(initialCards)
      setIsInitialized(true)
    }
  }, [videos, containerWidth, calculateDefaultCardWidth, defaultCardsPerRow, minCardHeight])

  // Set up container width observer
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)

      // Create ResizeObserver to watch container size changes
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width)
        }
      })

      resizeObserverRef.current.observe(containerRef.current)
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [])

  // Organize cards into intelligent grid rows
  const organizeCardsIntoRows = useCallback((cards: VideoCardData[]) => {
    const rows: VideoCardData[][] = []
    let currentRow: VideoCardData[] = []
    let currentRowWidth = 0
    const availableWidth = containerWidth - (containerPadding * 2)

    for (const card of cards) {
      const cardWidthWithGap = card.width + (currentRow.length > 0 ? cardGap : 0)
      
      // Check if card fits in current row
      if (currentRowWidth + cardWidthWithGap <= availableWidth && currentRow.length < defaultCardsPerRow) {
        currentRow.push(card)
        currentRowWidth += cardWidthWithGap
      } else {
        // Current row is full or card doesn't fit, start new row
        if (currentRow.length > 0) {
          rows.push([...currentRow])
        }
        currentRow = [card]
        currentRowWidth = card.width
      }
    }

    // Add remaining cards in current row
    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    // Update grid positions
    const updatedCards = cards.map((card) => {
      const rowIndex = rows.findIndex(row => row.some(c => c.video.id === card.video.id))
      const colIndex = rows[rowIndex]?.findIndex(c => c.video.id === card.video.id) ?? 0
      
      return {
        ...card,
        gridPosition: { row: rowIndex, col: colIndex }
      }
    })

    return { rows, updatedCards }
  }, [containerWidth, containerPadding, cardGap, defaultCardsPerRow])

  // Update grid organization when cards change
  useEffect(() => {
    if (videoCards.length > 0) {
      const { rows, updatedCards } = organizeCardsIntoRows(videoCards)
      setGridRows(rows)
      setVideoCards(updatedCards)
    }
  }, [videoCards.length, containerWidth])

  // Handle card resize with intelligent reflow
  const handleCardResize = useCallback((width: number, height: number, videoId: string) => {
    setVideoCards(prevCards => {
      const updatedCards = prevCards.map(card => 
        card.video.id === videoId 
          ? { ...card, width: Math.max(minCardWidth, Math.min(width, maxCardWidth)), height: Math.max(minCardHeight, Math.min(height, maxCardHeight)), isResizing: true }
          : card
      )

      // Reorganize grid with new dimensions
      const { rows: newRows, updatedCards: reorganizedCards } = organizeCardsIntoRows(updatedCards)
      setGridRows(newRows)

      // Auto-resize neighboring cards to fill space efficiently
      const resizedCardRowIndex = reorganizedCards.find(c => c.video.id === videoId)?.gridPosition.row ?? 0
      const rowCards = newRows[resizedCardRowIndex] || []
      
      if (rowCards.length < defaultCardsPerRow && rowCards.length > 0) {
        const availableWidth = containerWidth - (containerPadding * 2) - (cardGap * (rowCards.length - 1))
        const totalUsedWidth = rowCards.reduce((sum, card) => sum + card.width, 0)
        const excessWidth = availableWidth - totalUsedWidth
        
        if (excessWidth > 0 && rowCards.length > 1) {
          const widthPerCard = excessWidth / (rowCards.length - 1) // Don't resize the card being manually resized
          
          return reorganizedCards.map(card => {
            const isInSameRow = card.gridPosition.row === resizedCardRowIndex
            const isBeingResized = card.video.id === videoId
            
            if (isInSameRow && !isBeingResized && widthPerCard > 0) {
              const newWidth = Math.min(card.width + widthPerCard, maxCardWidth)
              return { ...card, width: newWidth, isResizing: false }
            }
            
            return { ...card, isResizing: card.video.id === videoId }
          })
        }
      }

      return reorganizedCards.map(card => ({ 
        ...card, 
        isResizing: card.video.id === videoId 
      }))
    })
  }, [containerWidth, containerPadding, cardGap, defaultCardsPerRow, minCardWidth, maxCardWidth, minCardHeight, maxCardHeight, organizeCardsIntoRows])

  // Reset to default layout
  const resetLayout = useCallback(() => {
    if (videos.length > 0) {
      const defaultWidth = calculateDefaultCardWidth(containerWidth)
      const defaultHeight = Math.max(minCardHeight, defaultWidth * 1.2)
      
      const resetCards: VideoCardData[] = videos.map((video, index) => ({
        video,
        width: defaultWidth,
        height: defaultHeight,
        gridPosition: {
          row: Math.floor(index / defaultCardsPerRow),
          col: index % defaultCardsPerRow
        }
      }))

      setVideoCards(resetCards)
    }
  }, [videos, containerWidth, calculateDefaultCardWidth, defaultCardsPerRow, minCardHeight])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Controls placeholder */}
        <div className="flex justify-between items-center">
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Grid placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg animate-pulse" style={{ height: '480px' }}></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No videos found. Be the first to upload one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={resetLayout}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors"
          title="Reset to default layout"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset Layout</span>
        </button>

        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{videos.length} videos</span>
          <span>•</span>
          <span>{gridRows.length} rows</span>
          <span>•</span>
          <span>Drag corners to resize</span>
        </div>
      </div>

      {/* Intelligent Video Grid */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ padding: `0 ${containerPadding}px` }}
      >
        {gridRows.map((row, rowIndex) => (
          <div 
            key={`row-${rowIndex}`}
            className="flex items-start mb-6 last:mb-0"
            style={{ gap: `${cardGap}px` }}
          >
            {row.map((cardData) => (
              <div
                key={cardData.video.id}
                className={`flex-shrink-0 transition-all duration-300 ${
                  cardData.isResizing ? 'z-50' : 'z-10'
                }`}
              >
                <ResizableVideoCard
                  video={cardData.video}
                  onVideoUpdate={onVideoUpdate}
                  onResize={handleCardResize}
                  defaultWidth={cardData.width}
                  defaultHeight={cardData.height}
                  minWidth={minCardWidth}
                  minHeight={minCardHeight}
                  maxWidth={maxCardWidth}
                  maxHeight={maxCardHeight}
                  gridPosition={cardData.gridPosition}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Grid Statistics */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Grid Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Videos:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{videos.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Grid Rows:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{gridRows.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Container Width:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">{containerWidth}px</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Cards Per Row:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {gridRows.length > 0 ? `${Math.min(...gridRows.map(row => row.length))}-${Math.max(...gridRows.map(row => row.length))}` : '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}