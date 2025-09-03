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
  cellSpan: number // How many grid cells this card occupies
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
  const [originalVideoCards, setOriginalVideoCards] = useState<VideoCardData[]>([])
  const [containerWidth, setContainerWidth] = useState<number>(1200)
  const [gridRows, setGridRows] = useState<VideoCardData[][]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  
  // Grid system constants
  const totalGridCells = 12 // Total cells available per row
  const defaultCellSpan = totalGridCells / defaultCardsPerRow // 4 cells per card for 3-card layout
  
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Calculate card width based on cell span
  const calculateCardWidth = useCallback((cellSpan: number, containerW: number, cardsInRow: number) => {
    const availableWidth = containerW - (containerPadding * 2) - (cardGap * (cardsInRow - 1))
    const cellWidth = availableWidth / totalGridCells
    return cellWidth * cellSpan
  }, [containerPadding, cardGap, totalGridCells])
  
  // Calculate cell span based on desired width
  const calculateCellSpan = useCallback((desiredWidth: number, containerW: number, cardsInRow: number) => {
    const availableWidth = containerW - (containerPadding * 2) - (cardGap * (cardsInRow - 1))
    const cellWidth = availableWidth / totalGridCells
    const span = Math.round(desiredWidth / cellWidth)
    return Math.max(2, Math.min(span, totalGridCells - 1)) // Min 2 cells, max 11 cells
  }, [containerPadding, cardGap, totalGridCells])

  // Initialize video cards with default sizing
  useEffect(() => {
    if (videos.length > 0 && containerWidth > 0) {
      const defaultWidth = calculateCardWidth(defaultCellSpan, containerWidth, defaultCardsPerRow)
      const defaultHeight = Math.max(minCardHeight, defaultWidth * 1.2) // 1.2 aspect ratio for cards
      
      const initialCards: VideoCardData[] = videos.map((video, index) => ({
        video,
        width: defaultWidth,
        height: defaultHeight,
        cellSpan: defaultCellSpan,
        gridPosition: {
          row: Math.floor(index / defaultCardsPerRow),
          col: index % defaultCardsPerRow
        }
      }))

      setVideoCards(initialCards)
      setOriginalVideoCards(initialCards) // Store the original state
      
      // Initialize grid rows
      const { rows } = organizeCardsIntoRows(initialCards)
      setGridRows(rows)
      setIsInitialized(true)
    }
  }, [videos, containerWidth, calculateCardWidth, defaultCardsPerRow, minCardHeight, defaultCellSpan])

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

  // Organize cards into cell-based grid rows
  const organizeCardsIntoRows = useCallback((cards: VideoCardData[]) => {
    const rows: VideoCardData[][] = []
    let currentRow: VideoCardData[] = []
    let currentRowCells = 0

    for (const card of cards) {
      // Check if card fits in current row (based on cell span)
      if (currentRowCells + card.cellSpan <= totalGridCells && currentRow.length > 0) {
        currentRow.push(card)
        currentRowCells += card.cellSpan
      } else {
        // Start new row if current row has cards
        if (currentRow.length > 0) {
          // Recalculate widths for cards in completed row
          const updatedRow = recalculateRowWidths(currentRow)
          rows.push(updatedRow)
        }
        // Start new row with current card
        currentRow = [card]
        currentRowCells = card.cellSpan
      }
    }

    // Add remaining cards in current row
    if (currentRow.length > 0) {
      const updatedRow = recalculateRowWidths(currentRow)
      rows.push(updatedRow)
    }

    // Update grid positions
    const updatedCards: VideoCardData[] = []
    rows.forEach((row, rowIndex) => {
      row.forEach((card, colIndex) => {
        updatedCards.push({
          ...card,
          gridPosition: { row: rowIndex, col: colIndex }
        })
      })
    })

    return { rows, updatedCards }
  }, [totalGridCells])

  // Recalculate actual widths based on cell spans for cards in a row
  const recalculateRowWidths = useCallback((rowCards: VideoCardData[]) => {
    const cardsInRow = rowCards.length
    return rowCards.map(card => ({
      ...card,
      width: calculateCardWidth(card.cellSpan, containerWidth, cardsInRow)
    }))
  }, [calculateCardWidth, containerWidth])

  // Update grid organization when container width changes
  useEffect(() => {
    if (videoCards.length > 0 && containerWidth > 0) {
      const { rows } = organizeCardsIntoRows(videoCards)
      setGridRows(rows)
    }
  }, [containerWidth, organizeCardsIntoRows])

  // Handle card resize with cell-based system
  const handleCardResize = useCallback((width: number, height: number, videoId: string) => {
    setVideoCards(prevCards => {
      // Find the card being resized
      const cardIndex = prevCards.findIndex(card => card.video.id === videoId)
      if (cardIndex === -1) return prevCards

      const resizedCard = prevCards[cardIndex]
      const currentRow = prevCards.filter(card => card.gridPosition.row === resizedCard.gridPosition.row)
      
      // Calculate new cell span based on desired width
      const newCellSpan = calculateCellSpan(width, containerWidth, currentRow.length)
      
      // Update the card with new cell span and height
      const updatedCards = prevCards.map(card => 
        card.video.id === videoId 
          ? { 
              ...card, 
              cellSpan: newCellSpan,
              height: Math.max(minCardHeight, Math.min(height, maxCardHeight)), 
              isResizing: true 
            }
          : { ...card, isResizing: false }
      )

      // Reorganize grid with new cell spans
      const { rows: newRows, updatedCards: reorganizedCards } = organizeCardsIntoRows(updatedCards)
      setGridRows(newRows)

      return reorganizedCards
    })
  }, [calculateCellSpan, containerWidth, minCardHeight, maxCardHeight, organizeCardsIntoRows])

  // Reset to original layout and sizes
  const resetLayout = useCallback(() => {
    if (originalVideoCards.length > 0) {
      // Restore the exact original state
      setVideoCards([...originalVideoCards])
      
      // Reorganize grid rows with original cards
      const { rows } = organizeCardsIntoRows(originalVideoCards)
      setGridRows(rows)
    }
  }, [originalVideoCards, organizeCardsIntoRows])

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

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{videos.length} videos</span>
            <span>•</span>
            <span>{gridRows.length} rows</span>
            <span>•</span>
            <span>Drag corners to resize</span>
          </div>
          
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center space-x-2 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              showGrid 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
            title="Toggle grid overlay for development"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span>Grid {showGrid ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Intelligent Video Grid */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ padding: `0 ${containerPadding}px` }}
      >
        {/* Grid Overlay for Development */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-0" style={{ padding: `0 ${containerPadding}px` }}>
            {/* Cell guides - 12 cells per row */}
            {Array.from({ length: totalGridCells + 1 }).map((_, i) => {
              const x = (i * (containerWidth - containerPadding * 2)) / totalGridCells
              return (
                <div
                  key={`cell-${i}`}
                  className="absolute top-0 bottom-0 border-l border-red-200 border-dashed opacity-40"
                  style={{ left: x }}
                />
              )
            })}
            
            {/* Major column guides - default cards positions */}
            {Array.from({ length: defaultCardsPerRow + 1 }).map((_, i) => {
              const x = (i * (containerWidth - containerPadding * 2)) / defaultCardsPerRow
              return (
                <div
                  key={`major-col-${i}`}
                  className="absolute top-0 bottom-0 border-l-2 border-red-500 border-dashed opacity-60"
                  style={{ left: x }}
                />
              )
            })}
            
            {/* Row guides */}
            {gridRows.map((row, rowIndex) => {
              const maxHeight = Math.max(...row.map(card => card.height), 400)
              const y = rowIndex * (maxHeight + cardGap * 1.5)
              return (
                <div
                  key={`row-${rowIndex}`}
                  className="absolute left-0 right-0 border-t-2 border-blue-300 border-dashed opacity-60"
                  style={{ top: y }}
                />
              )
            })}
            
            {/* Cell span indicators */}
            {videoCards.map((card) => {
              const row = gridRows[card.gridPosition.row]
              if (!row) return null
              
              const startCell = row.slice(0, card.gridPosition.col).reduce((sum, c) => sum + c.cellSpan, 0)
              const cellWidth = (containerWidth - containerPadding * 2) / totalGridCells
              const x = startCell * cellWidth
              const width = card.cellSpan * cellWidth
              
              return (
                <div
                  key={`span-${card.video.id}`}
                  className="absolute border-2 border-green-400 bg-green-100 bg-opacity-20 pointer-events-none"
                  style={{ 
                    left: x, 
                    width: width, 
                    top: card.gridPosition.row * 500, // Approximate row height
                    height: 50
                  }}
                >
                  <div className="absolute top-1 left-1 text-xs font-bold text-green-700">
                    {card.cellSpan} cells
                  </div>
                </div>
              )
            })}
            
            {/* Grid info overlay */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>Container: {containerWidth}px</div>
              <div>Total Cells: {totalGridCells}</div>
              <div>Default Span: {defaultCellSpan}</div>
              <div>Padding: {containerPadding}px</div>
              <div>Gap: {cardGap}px</div>
              <div>Rows: {gridRows.length}</div>
            </div>
          </div>
        )}
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