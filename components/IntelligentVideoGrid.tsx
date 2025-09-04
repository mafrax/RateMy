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
  maxCardWidth = 1200,
  minCardHeight = 350,
  maxCardHeight = 1200,
  containerPadding = 24,
  cardGap = 24
}: IntelligentVideoGridProps) {
  const [videoCards, setVideoCards] = useState<VideoCardData[]>([])
  const [originalVideoCards, setOriginalVideoCards] = useState<VideoCardData[]>([])
  const [containerWidth, setContainerWidth] = useState<number>(1200)
  const [gridRows, setGridRows] = useState<VideoCardData[][]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  
  // Resize preview state
  const [resizePreviewCard, setResizePreviewCard] = useState<VideoCardData | null>(null)
  const [previewGridRows, setPreviewGridRows] = useState<VideoCardData[][]>([])
  const [isResizing, setIsResizing] = useState(false)
  
  // Drag and drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)
  const [dropTargetCardId, setDropTargetCardId] = useState<string | null>(null)
  const [dropTargetRowIndex, setDropTargetRowIndex] = useState<number | null>(null)
  
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
    return Math.max(2, Math.min(span, totalGridCells)) // Min 2 cells, max 12 cells (full row)
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
  
  // Calculate available cells in a row
  const getRowAvailableCells = useCallback((rowIndex: number) => {
    if (!gridRows[rowIndex]) return 0
    const row = gridRows[rowIndex]
    const usedCells = row.reduce((sum, card) => sum + card.cellSpan, 0)
    return totalGridCells - usedCells
  }, [gridRows, totalGridCells])

  // Update grid organization when container width changes
  useEffect(() => {
    if (videoCards.length > 0 && containerWidth > 0) {
      const { rows } = organizeCardsIntoRows(videoCards)
      setGridRows(rows)
    }
  }, [containerWidth, organizeCardsIntoRows])

  // Handle card resize start
  const handleCardResizeStart = useCallback((videoId: string) => {
    setIsResizing(true)
    setVideoCards(prevCards => 
      prevCards.map(card => 
        card.video.id === videoId 
          ? { ...card, isResizing: true }
          : { ...card, isResizing: false }
      )
    )
  }, [])

  // Handle card resize during drag (preview only)
  const handleCardResize = useCallback((width: number, height: number, videoId: string) => {
    // Only update the visual size, don't reorganize grid yet
    setVideoCards(prevCards => {
      const cardIndex = prevCards.findIndex(card => card.video.id === videoId)
      if (cardIndex === -1) return prevCards

      const resizedCard = prevCards[cardIndex]
      const currentRow = prevCards.filter(card => card.gridPosition.row === resizedCard.gridPosition.row)
      
      // Calculate new cell span based on desired width
      const newCellSpan = calculateCellSpan(width, containerWidth, currentRow.length)
      
      // Create preview card with new dimensions
      const previewCard: VideoCardData = {
        ...resizedCard,
        cellSpan: newCellSpan,
        height: Math.max(minCardHeight, Math.min(height, maxCardHeight)),
        width: width,
        isResizing: true
      }
      
      // Generate preview layout without affecting actual grid
      const previewCards = prevCards.map(card => 
        card.video.id === videoId ? previewCard : card
      )
      
      const { rows: newRows } = organizeCardsIntoRows(previewCards)
      setPreviewGridRows(newRows)
      setResizePreviewCard(previewCard)

      // Only update the resizing card's visual size, keep grid structure
      return prevCards.map(card => 
        card.video.id === videoId 
          ? { 
              ...card,
              width: width,
              height: Math.max(minCardHeight, Math.min(height, maxCardHeight)), 
              isResizing: true 
            }
          : card
      )
    })
  }, [calculateCellSpan, containerWidth, minCardHeight, maxCardHeight, organizeCardsIntoRows])

  // Handle card resize stop (apply changes)
  const handleCardResizeStop = useCallback((width: number, height: number, videoId: string) => {
    setIsResizing(false)
    setResizePreviewCard(null)
    setPreviewGridRows([])
    
    setVideoCards(prevCards => {
      const cardIndex = prevCards.findIndex(card => card.video.id === videoId)
      if (cardIndex === -1) return prevCards

      const resizedCard = prevCards[cardIndex]
      const currentRow = prevCards.filter(card => card.gridPosition.row === resizedCard.gridPosition.row)
      
      // Calculate new cell span based on final width
      const newCellSpan = calculateCellSpan(width, containerWidth, currentRow.length)
      
      // Update the card with new cell span and height
      const updatedCards = prevCards.map(card => 
        card.video.id === videoId 
          ? { 
              ...card, 
              cellSpan: newCellSpan,
              width: width,
              height: Math.max(minCardHeight, Math.min(height, maxCardHeight)), 
              isResizing: false 
            }
          : { ...card, isResizing: false }
      )

      // Now reorganize grid with final dimensions
      const { rows: newRows, updatedCards: reorganizedCards } = organizeCardsIntoRows(updatedCards)
      setGridRows(newRows)

      return reorganizedCards
    })
  }, [calculateCellSpan, containerWidth, minCardHeight, maxCardHeight, organizeCardsIntoRows])

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, videoId: string) => {
    setDraggedCardId(videoId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null)
    setDropTargetCardId(null)
    setDropTargetRowIndex(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetVideoId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Drop event:', { draggedCardId, targetVideoId }) // Debug log
    
    if (!draggedCardId || draggedCardId === targetVideoId) {
      setDraggedCardId(null)
      setDropTargetCardId(null)
      return
    }

    setVideoCards(prevCards => {
      console.log('Processing drop with cards:', prevCards.length) // Debug log
      
      const draggedIndex = prevCards.findIndex(card => card.video.id === draggedCardId)
      const targetIndex = prevCards.findIndex(card => card.video.id === targetVideoId)
      
      if (draggedIndex === -1 || targetIndex === -1) {
        console.log('Card not found:', { draggedIndex, targetIndex }) // Debug log
        return prevCards
      }

      // Simple position swap - create new array with swapped positions
      const newCards = [...prevCards]
      const draggedCard = newCards[draggedIndex]
      const targetCard = newCards[targetIndex]
      
      // Swap the cards in the array
      newCards[draggedIndex] = targetCard
      newCards[targetIndex] = draggedCard
      
      console.log('Cards swapped successfully') // Debug log
      
      // Reorganize grid after swap
      const { rows, updatedCards } = organizeCardsIntoRows(newCards)
      setGridRows(rows)
      return updatedCards
    })

    setDraggedCardId(null)
    setDropTargetCardId(null)
  }, [draggedCardId, organizeCardsIntoRows])

  const handleCardDragOver = useCallback((targetVideoId: string) => {
    if (draggedCardId && draggedCardId !== targetVideoId) {
      setDropTargetCardId(targetVideoId)
    }
  }, [draggedCardId])

  const handleCardDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drop target if we're actually leaving the card
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetCardId(null)
    }
  }, [])

  // Row drop handlers
  const handleRowDragOver = useCallback((e: React.DragEvent, rowIndex: number) => {
    if (!draggedCardId) return
    
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const draggedCard = videoCards.find(card => card.video.id === draggedCardId)
    if (!draggedCard) return
    
    const availableCells = getRowAvailableCells(rowIndex)
    // Only show as drop target if the card can fit
    if (draggedCard.cellSpan <= availableCells) {
      setDropTargetRowIndex(rowIndex)
      setDropTargetCardId(null) // Clear card drop target
    }
  }, [draggedCardId, videoCards, getRowAvailableCells])

  const handleRowDrop = useCallback((e: React.DragEvent, targetRowIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Row drop event:', { draggedCardId, targetRowIndex }) // Debug log
    
    if (!draggedCardId) return
    
    const draggedCard = videoCards.find(card => card.video.id === draggedCardId)
    if (!draggedCard) return
    
    // Check if card can fit in target row
    const availableCells = getRowAvailableCells(targetRowIndex)
    if (draggedCard.cellSpan > availableCells) {
      console.log('Card does not fit in target row') // Debug log
      return
    }
    
    setVideoCards(prevCards => {
      console.log('Moving card to row:', targetRowIndex) // Debug log
      
      // Manual placement - don't reorganize, just move the card to the specific row
      const updatedCards = prevCards.map(card => {
        if (card.video.id === draggedCardId) {
          // Find the next available column position in the target row
          const targetRowCards = prevCards.filter(c => c.gridPosition.row === targetRowIndex && c.video.id !== draggedCardId)
          return {
            ...card,
            gridPosition: { row: targetRowIndex, col: targetRowCards.length }
          }
        }
        return card
      })
      
      // Only recalculate widths for the rows that were affected, don't reorganize positions
      const affectedRows = new Set([draggedCard.gridPosition.row, targetRowIndex])
      const updatedCardsWithWidths = updatedCards.map(card => {
        if (affectedRows.has(card.gridPosition.row)) {
          const rowCards = updatedCards.filter(c => c.gridPosition.row === card.gridPosition.row)
          return {
            ...card,
            width: calculateCardWidth(card.cellSpan, containerWidth, rowCards.length)
          }
        }
        return card
      })
      
      // Manually rebuild grid rows without reorganization
      const maxRow = Math.max(...updatedCardsWithWidths.map(card => card.gridPosition.row))
      const newRows: VideoCardData[][] = []
      
      for (let rowIndex = 0; rowIndex <= maxRow; rowIndex++) {
        const rowCards = updatedCardsWithWidths
          .filter(card => card.gridPosition.row === rowIndex)
          .sort((a, b) => a.gridPosition.col - b.gridPosition.col)
        
        if (rowCards.length > 0) {
          newRows.push(rowCards)
        }
      }
      
      setGridRows(newRows)
      return updatedCardsWithWidths
    })
    
    setDraggedCardId(null)
    setDropTargetCardId(null)
    setDropTargetRowIndex(null)
  }, [draggedCardId, videoCards, getRowAvailableCells, calculateCardWidth, containerWidth])

  const handleRowDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetRowIndex(null)
    }
  }, [])

  // Reset to original layout and sizes
  const resetLayout = useCallback(() => {
    if (originalVideoCards.length > 0) {
      // Reset all cards to 4-cell size
      const resetCards = originalVideoCards.map((card, index) => ({
        ...card,
        cellSpan: 4, // Set all cards to 4-cell size
        width: calculateCardWidth(4, containerWidth, defaultCardsPerRow),
        height: Math.max(minCardHeight, calculateCardWidth(4, containerWidth, defaultCardsPerRow) * 1.2),
        gridPosition: {
          row: Math.floor(index / defaultCardsPerRow),
          col: index % defaultCardsPerRow
        }
      }))
      
      setVideoCards(resetCards)
      
      // Reorganize grid rows with reset cards
      const { rows } = organizeCardsIntoRows(resetCards)
      setGridRows(rows)
    }
  }, [originalVideoCards, organizeCardsIntoRows, calculateCardWidth, containerWidth, defaultCardsPerRow, minCardHeight])

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
            <span>Drag corners to resize (up to 12 cells)</span>
            <span>•</span>
            <span>Drag cards to reorder</span>
            {draggedCardId && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">
                  Dragging {videoCards.find(c => c.video.id === draggedCardId)?.cellSpan} cells...
                </span>
              </>
            )}
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

        {/* Render preview grid during resize */}
        {isResizing && previewGridRows.length > 0 && (
          <div className="absolute inset-0 z-30 pointer-events-none bg-white bg-opacity-75">
            <div className="space-y-4">
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 text-center">
                <span className="text-blue-700 font-medium text-sm">Preview: Release mouse to apply</span>
              </div>
              {previewGridRows.map((row, rowIndex) => (
                <div 
                  key={`preview-row-${rowIndex}`}
                  className="flex items-start opacity-60"
                  style={{ gap: `${cardGap}px`, paddingLeft: `${containerPadding}px`, paddingRight: `${containerPadding}px` }}
                >
                  {row.map((cardData) => (
                    <div
                      key={`preview-${cardData.video.id}`}
                      className={`flex-shrink-0 border-2 border-dashed rounded-lg flex items-center justify-center ${
                        resizePreviewCard?.video.id === cardData.video.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}
                      style={{ 
                        width: cardData.width, 
                        height: Math.min(cardData.height, 100),
                        minHeight: '80px'
                      }}
                    >
                      <div className="text-center text-xs">
                        <div className="font-medium">{cardData.cellSpan} cells</div>
                        {resizePreviewCard?.video.id === cardData.video.id && (
                          <div className="text-blue-600 font-bold">New Position</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actual grid */}
        {gridRows.map((row, rowIndex) => {
          const availableCells = getRowAvailableCells(rowIndex)
          const draggedCard = draggedCardId ? videoCards.find(card => card.video.id === draggedCardId) : null
          const canDropInRow = draggedCard ? draggedCard.cellSpan <= availableCells : false
          const isRowDropTarget = dropTargetRowIndex === rowIndex
          
          return (
            <div 
              key={`row-${rowIndex}`}
              className={`flex items-start mb-6 last:mb-0 relative transition-all duration-200 ${
                isRowDropTarget 
                  ? 'bg-green-50 border-2 border-green-300 border-dashed rounded-lg p-2' 
                  : draggedCardId && canDropInRow 
                    ? 'border-2 border-transparent hover:border-green-200 hover:bg-green-25 rounded-lg p-2'
                    : ''
              }`}
              style={{ gap: `${cardGap}px` }}
              onDragOver={(e) => handleRowDragOver(e, rowIndex)}
              onDragLeave={handleRowDragLeave}
              onDrop={(e) => handleRowDrop(e, rowIndex)}
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
                    onResizeStart={handleCardResizeStart}
                    onResizeStop={handleCardResizeStop}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      handleDragOver(e)
                      handleCardDragOver(cardData.video.id)
                    }}
                    onDragLeave={handleCardDragLeave}
                    onDrop={handleDrop}
                    defaultWidth={cardData.width}
                    defaultHeight={cardData.height}
                    minWidth={minCardWidth}
                    minHeight={minCardHeight}
                    maxWidth={maxCardWidth}
                    maxHeight={maxCardHeight}
                    gridPosition={cardData.gridPosition}
                    isDragging={draggedCardId === cardData.video.id}
                    isDropTarget={dropTargetCardId === cardData.video.id}
                  />
                </div>
              ))}
              
              {/* Show available space indicator when dragging */}
              {draggedCardId && canDropInRow && (
                <div className="flex-1 flex items-center justify-center min-h-[100px] border-2 border-green-300 border-dashed rounded-lg bg-green-50 opacity-75">
                  <div className="text-center text-green-700">
                    <div className="text-sm font-medium">Drop Here</div>
                    <div className="text-xs">{availableCells} cells available</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
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
          <div>
            <span className="text-gray-600 dark:text-gray-400">Available Cells:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {gridRows.map((row, i) => getRowAvailableCells(i)).join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}