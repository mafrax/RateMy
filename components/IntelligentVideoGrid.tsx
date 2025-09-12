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
  subPosition?: { parentCardId: string; offsetY: number } // For cards positioned below other cards
}

interface SubSpace {
  parentCardId: string
  parentRow: number
  parentCol: number
  availableHeight: number
  availableWidth: number
  offsetY: number // Y position relative to parent card
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
  defaultCardsPerRow = 4, // Increased from 3 to 4 for better space utilization
  minCardWidth = 280, // Reduced from 400 to 280 for narrower cards
  maxCardWidth = 1200, // This will be overridden dynamically
  minCardHeight = 350,
  maxCardHeight = 1200,
  containerPadding = 16,
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
  
  // Sub-positioning state
  const [availableSubSpaces, setAvailableSubSpaces] = useState<SubSpace[]>([])
  const [dropTargetSubSpace, setDropTargetSubSpace] = useState<SubSpace | null>(null)
  
  // Grid system constants - responsive
  const totalGridCells = 12 // Total cells available per row
  
  // Responsive cards per row based on container width
  const getResponsiveCardsPerRow = useCallback(() => {
    if (containerWidth < 600) return 1 // Mobile: 1 card per row
    if (containerWidth < 900) return 2 // Small tablet: 2 cards per row
    if (containerWidth < 1400) return 3 // Tablet/small desktop: 3 cards per row
    if (containerWidth < 1800) return 4 // Desktop: 4 cards per row
    return Math.min(5, defaultCardsPerRow) // Large desktop: up to 5 cards per row
  }, [containerWidth, defaultCardsPerRow])
  
  const currentCardsPerRow = getResponsiveCardsPerRow()
  const defaultCellSpan = totalGridCells / currentCardsPerRow
  
  // Dynamic sizing based on container width
  const dynamicMaxCardWidth = containerWidth - (containerPadding * 2)
  // Calculate what the card width should be for default layout
  const availableWidthForCards = containerWidth - (containerPadding * 2) - ((currentCardsPerRow - 1) * cardGap)
  const expectedCardWidth = availableWidthForCards / currentCardsPerRow
  const dynamicMinCardWidth = Math.min(expectedCardWidth * 0.8, Math.max(200, containerWidth * 0.12)) // Reduced from 90% to 80% for narrower cards
  const dynamicMaxCardHeight = Math.max(450, containerWidth * 0.35) // Slightly increased height for better proportions
  const dynamicMinCardHeight = Math.max(280, containerWidth * 0.15) // Increased minimum height for better video proportions
  
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Calculate card width - for default layout, fill available space; for resized cards, use cell system
  const calculateCardWidth = useCallback((cellSpan: number, containerW: number, cardsInRow: number) => {
    if (!containerW || containerW <= 0) {
      console.warn('Invalid containerWidth in calculateCardWidth:', containerW)
      return 400 // Fallback width
    }
    
    const availableWidth = containerW - (containerPadding * 2) - ((cardsInRow - 1) * cardGap)
    
    // For default layout (equal cell spans), distribute width evenly among cards to fill entire width
    if (cellSpan === defaultCellSpan && cardsInRow === currentCardsPerRow) {
      return availableWidth / cardsInRow
    }
    
    // For resized cards, use the cell system
    const cellWidth = availableWidth / totalGridCells
    return cellWidth * cellSpan
  }, [containerPadding, totalGridCells, cardGap, defaultCellSpan, currentCardsPerRow])
  
  // Calculate cell span based on desired width
  const calculateCellSpan = useCallback((desiredWidth: number, containerW: number, cardsInRow: number) => {
    const availableWidth = containerW - (containerPadding * 2)
    const cellWidth = availableWidth / totalGridCells
    const span = Math.round(desiredWidth / cellWidth)
    return Math.max(2, Math.min(span, totalGridCells)) // Min 2 cells, max 12 cells (full row)
  }, [containerPadding, totalGridCells])

  // Detect available sub-spaces where cards can be positioned below shorter cards
  const detectAvailableSubSpaces = useCallback((cards: VideoCardData[]): SubSpace[] => {
    const subSpaces: SubSpace[] = []
    const minSubSpaceHeight = 150 // Minimum height required for a sub-space
    
    // Group cards by rows to analyze height differences
    const rowGroups: { [key: number]: VideoCardData[] } = {}
    cards.forEach(card => {
      if (!card.subPosition) { // Only consider main positioned cards
        if (!rowGroups[card.gridPosition.row]) {
          rowGroups[card.gridPosition.row] = []
        }
        rowGroups[card.gridPosition.row].push(card)
      }
    })

    // Analyze each row for height differences
    Object.entries(rowGroups).forEach(([rowIndexStr, rowCards]) => {
      const rowIndex = parseInt(rowIndexStr)
      if (rowCards.length < 2) return // Need at least 2 cards to create sub-spaces
      
      // Find the tallest card in the row
      const maxHeight = Math.max(...rowCards.map(card => card.height))
      
      // Check each card to see if there's space below it
      rowCards.forEach(card => {
        const availableHeight = maxHeight - card.height
        if (availableHeight >= minSubSpaceHeight) {
          // Check if there's already a sub-positioned card below this parent
          const hasSubCard = cards.some(c => 
            c.subPosition?.parentCardId === card.video.id
          )
          
          if (!hasSubCard) {
            subSpaces.push({
              parentCardId: card.video.id,
              parentRow: rowIndex,
              parentCol: card.gridPosition.col,
              availableHeight,
              availableWidth: card.width,
              offsetY: card.height + 10 // Small gap below the parent card
            })
          }
        }
      })
    })
    
    return subSpaces
  }, [])

  // Initialize video cards with default sizing
  useEffect(() => {
    if (videos.length > 0 && containerWidth > 0) {
      const defaultWidth = calculateCardWidth(defaultCellSpan, containerWidth, currentCardsPerRow)
      // Improved aspect ratio calculation for vertical videos - taller cards to reduce letterboxing
      const defaultHeight = Math.max(dynamicMinCardHeight, Math.min(defaultWidth * 1.2, dynamicMaxCardHeight)) // Changed from 0.6 to 1.2 for better vertical video proportions
      
      
      const initialCards: VideoCardData[] = videos.map((video, index) => ({
        video,
        width: defaultWidth,
        height: defaultHeight,
        cellSpan: defaultCellSpan,
        gridPosition: {
          row: Math.floor(index / currentCardsPerRow),
          col: index % currentCardsPerRow
        }
      }))

      setVideoCards(initialCards)
      setOriginalVideoCards(initialCards) // Store the original state
      
      // Initialize grid rows
      const { rows } = organizeCardsIntoRows(initialCards, containerWidth)
      setGridRows(rows)
      setIsInitialized(true)
    }
  }, [videos, containerWidth, calculateCardWidth, currentCardsPerRow, dynamicMinCardHeight, dynamicMaxCardHeight, defaultCellSpan])

  // Set up container width observer
  useEffect(() => {
    const updateContainerWidth = () => {
      // Use full viewport width minus padding (48px total = 24px each side)
      const fullWidth = window.innerWidth - 48
      setContainerWidth(fullWidth)
    }

    // Set initial width
    updateContainerWidth()

    // Listen for window resize
    window.addEventListener('resize', updateContainerWidth)

    return () => {
      window.removeEventListener('resize', updateContainerWidth)
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [])

  // Organize cards into cell-based grid rows
  const organizeCardsIntoRows = useCallback((cards: VideoCardData[], currentContainerWidth: number) => {
    const rows: VideoCardData[][] = []
    let currentRow: VideoCardData[] = []
    let currentRowCells = 0

    // Filter out sub-positioned cards from main grid layout
    const mainGridCards = cards.filter(card => !card.subPosition)

    for (const card of mainGridCards) {
      // Check if card fits in current row (based on cell span)
      if (currentRowCells + card.cellSpan <= totalGridCells && currentRow.length > 0) {
        currentRow.push(card)
        currentRowCells += card.cellSpan
      } else {
        // Start new row if current row has cards
        if (currentRow.length > 0) {
          // Recalculate widths for cards in completed row
          const updatedRow = recalculateRowWidths(currentRow, currentContainerWidth)
          rows.push(updatedRow)
        }
        // Start new row with current card
        currentRow = [card]
        currentRowCells = card.cellSpan
      }
    }

    // Add remaining cards in current row
    if (currentRow.length > 0) {
      const updatedRow = recalculateRowWidths(currentRow, currentContainerWidth)
      rows.push(updatedRow)
    }

    // Update grid positions for main grid cards only
    const updatedMainGridCards: VideoCardData[] = []
    rows.forEach((row, rowIndex) => {
      row.forEach((card, colIndex) => {
        updatedMainGridCards.push({
          ...card,
          gridPosition: { row: rowIndex, col: colIndex }
        })
      })
    })

    // Preserve sub-positioned cards unchanged and combine with main grid cards
    const subPositionedCards = cards.filter(card => card.subPosition)
    const allUpdatedCards = [...updatedMainGridCards, ...subPositionedCards]

    return { rows, updatedCards: allUpdatedCards }
  }, [totalGridCells])

  // Recalculate actual widths based on cell spans for cards in a row
  const recalculateRowWidths = useCallback((rowCards: VideoCardData[], currentContainerWidth: number) => {
    if (!currentContainerWidth || currentContainerWidth <= 0) {
      console.error('Invalid currentContainerWidth in recalculateRowWidths:', currentContainerWidth, 'Stack:', new Error().stack)
      return rowCards // Return unchanged if invalid width
    }
    
    const cardsInRow = rowCards.length
    return rowCards.map(card => {
      const width = calculateCardWidth(card.cellSpan, currentContainerWidth, cardsInRow)
      return {
        ...card,
        width: width
      }
    })
  }, [calculateCardWidth])
  
  // Calculate available cells in a row
  const getRowAvailableCells = useCallback((rowIndex: number) => {
    if (!gridRows[rowIndex]) return 0
    const row = gridRows[rowIndex]
    const usedCells = row.reduce((sum, card) => sum + card.cellSpan, 0)
    return totalGridCells - usedCells
  }, [gridRows, totalGridCells])

  // Auto-cleanup function to move orphaned sub-positioned cards back to main grid
  const cleanupOrphanedSubCards = useCallback((cards: VideoCardData[]): VideoCardData[] => {
    const availableSubSpaces = detectAvailableSubSpaces(cards)
    const availableParentIds = new Set(availableSubSpaces.map(space => space.parentCardId))
    
    return cards.map(card => {
      // If card is sub-positioned but its parent no longer has available sub-space
      if (card.subPosition && !availableParentIds.has(card.subPosition.parentCardId)) {
        // Double-check: Find the actual parent card and verify it truly can't accommodate this sub-card
        const parentCard = cards.find(c => c.video.id === card.subPosition!.parentCardId)
        if (parentCard) {
          // Check if the parent card in its current row has sufficient height difference
          const rowCards = cards.filter(c => 
            !c.subPosition && c.gridPosition.row === parentCard.gridPosition.row
          )
          const maxRowHeight = Math.max(...rowCards.map(c => c.height))
          const availableHeight = maxRowHeight - parentCard.height
          
          // If there's still sufficient space (150px minimum), keep the sub-positioning
          if (availableHeight >= 150) {
            return card
          }
        }
        
        console.log(`Auto-cleanup: Moving card ${card.video.id} back to main grid`) // Debug log
        
        // Remove sub-positioning and restore card to main grid
        return {
          ...card,
          subPosition: undefined,
          // Reset to reasonable main-grid dimensions
          width: Math.max(card.width, dynamicMinCardWidth),
          height: Math.max(card.height, dynamicMinCardHeight),
        }
      }
      return card
    })
  }, [detectAvailableSubSpaces, dynamicMinCardWidth, dynamicMinCardHeight])

  // Update card widths when container width changes
  useEffect(() => {
    if (videoCards.length > 0 && containerWidth > 0) {
      // Recalculate all card widths with the new container width
      const updatedCards = videoCards.map(card => {
        if (!card.subPosition && card.cellSpan === defaultCellSpan) {
          // For default layout cards, recalculate width
          const newWidth = calculateCardWidth(card.cellSpan, containerWidth, currentCardsPerRow)
          return { ...card, width: newWidth }
        }
        return card
      })
      
      // Only update if widths actually changed
      const widthsChanged = updatedCards.some((card, index) => 
        Math.abs(card.width - videoCards[index].width) > 1
      )
      
      if (widthsChanged) {
        console.log('Container width changed, updating card widths')
        setVideoCards(updatedCards)
        return // Exit early, other useEffect will handle grid organization
      }
    }
  }, [containerWidth, calculateCardWidth, currentCardsPerRow, defaultCellSpan])

  // Update grid organization when cards change
  useEffect(() => {
    if (videoCards.length > 0 && containerWidth > 0) {
      // Skip cleanup during drag operations to avoid interfering
      if (!draggedCardId) {
        // First cleanup orphaned sub-positioned cards
        const cleanedCards = cleanupOrphanedSubCards(videoCards)
        
        // If cleanup resulted in changes, update the cards state
        if (cleanedCards !== videoCards) {
          const hasChanges = cleanedCards.some((card, index) => 
            card.subPosition !== videoCards[index]?.subPosition
          )
          
          if (hasChanges) {
            setVideoCards(cleanedCards)
            return // Exit early, useEffect will re-run with cleaned cards
          }
        }
      }
      
      const { rows } = organizeCardsIntoRows(videoCards, containerWidth)
      setGridRows(rows)
      
      // Update available sub-spaces when grid changes
      const subSpaces = detectAvailableSubSpaces(videoCards)
      setAvailableSubSpaces(subSpaces)
    }
  }, [organizeCardsIntoRows, detectAvailableSubSpaces, videoCards, cleanupOrphanedSubCards, draggedCardId, containerWidth])

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
        height: Math.max(dynamicMinCardHeight, Math.min(height, dynamicMaxCardHeight)),
        width: width,
        isResizing: true
      }
      
      // Generate preview layout without affecting actual grid
      const previewCards = prevCards.map(card => 
        card.video.id === videoId ? previewCard : card
      )
      
      const { rows: newRows } = organizeCardsIntoRows(previewCards, containerWidth)
      setPreviewGridRows(newRows)
      setResizePreviewCard(previewCard)

      // Only update the resizing card's visual size, keep grid structure
      return prevCards.map(card => 
        card.video.id === videoId 
          ? { 
              ...card,
              width: width,
              height: Math.max(dynamicMinCardHeight, Math.min(height, dynamicMaxCardHeight)), 
              isResizing: true 
            }
          : card
      )
    })
  }, [calculateCellSpan, containerWidth, dynamicMinCardHeight, dynamicMaxCardHeight, organizeCardsIntoRows])

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
              height: Math.max(dynamicMinCardHeight, Math.min(height, dynamicMaxCardHeight)), 
              isResizing: false 
            }
          : { ...card, isResizing: false }
      )

      // Apply auto-cleanup for orphaned sub-positioned cards after resize
      const cleanedCards = cleanupOrphanedSubCards(updatedCards)

      // Now reorganize grid with final dimensions
      const { rows: newRows, updatedCards: reorganizedCards } = organizeCardsIntoRows(cleanedCards, containerWidth)
      setGridRows(newRows)

      return reorganizedCards
    })
  }, [calculateCellSpan, containerWidth, dynamicMinCardHeight, dynamicMaxCardHeight, organizeCardsIntoRows, cleanupOrphanedSubCards])

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, videoId: string) => {
    setDraggedCardId(videoId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null)
    setDropTargetCardId(null)
    setDropTargetRowIndex(null)
    setDropTargetSubSpace(null)
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
      const { rows, updatedCards } = organizeCardsIntoRows(newCards, containerWidth)
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

  // Sub-space drag handlers
  const handleSubSpaceDragOver = useCallback((e: React.DragEvent, subSpace: SubSpace) => {
    if (!draggedCardId) return
    
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    setDropTargetSubSpace(subSpace)
    setDropTargetCardId(null) // Clear card drop target
    setDropTargetRowIndex(null) // Clear row drop target
  }, [draggedCardId])

  const handleSubSpaceDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetSubSpace(null)
    }
  }, [])

  const handleSubSpaceDrop = useCallback((e: React.DragEvent, subSpace: SubSpace) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Sub-space drop event:', { draggedCardId, subSpace }) // Debug log
    
    if (!draggedCardId) return
    
    setVideoCards(prevCards => {
      console.log('Moving card to sub-space:', subSpace.parentCardId) // Debug log
      
      const updatedCards = prevCards.map(card => {
        if (card.video.id === draggedCardId) {
          // Calculate adaptive dimensions for sub-space
          const maxSubWidth = subSpace.availableWidth
          const maxSubHeight = subSpace.availableHeight
          
          // Adaptive sizing - maintain aspect ratio but fit within constraints
          const currentAspectRatio = card.width / card.height
          let newWidth = maxSubWidth
          let newHeight = newWidth / currentAspectRatio
          
          // If height exceeds available space, constrain by height instead
          if (newHeight > maxSubHeight) {
            newHeight = maxSubHeight
            newWidth = newHeight * currentAspectRatio
          }
          
          // Ensure minimum dimensions
          newWidth = Math.max(newWidth, dynamicMinCardWidth * 0.7) // Allow smaller in sub-spaces
          newHeight = Math.max(newHeight, dynamicMinCardHeight * 0.7)
          
          return {
            ...card,
            subPosition: {
              parentCardId: subSpace.parentCardId,
              offsetY: subSpace.offsetY
            },
            width: newWidth,
            height: newHeight,
            // Keep original grid position for potential restoration
            gridPosition: card.gridPosition
          }
        }
        return card
      })
      
      // Don't run cleanup immediately after positioning, let the useEffect handle it later
      return updatedCards
    })
    
    setDraggedCardId(null)
    setDropTargetSubSpace(null)
  }, [draggedCardId, detectAvailableSubSpaces, dynamicMinCardWidth, dynamicMinCardHeight])

  // Reset to original layout and sizes
  const resetLayout = useCallback(() => {
    if (originalVideoCards.length > 0) {
      // Reset all cards to default cell size and clear sub-positioning
      const resetCards = originalVideoCards.map((card, index) => ({
        ...card,
        cellSpan: Math.round(defaultCellSpan), // Set all cards to default cell size
        width: calculateCardWidth(Math.round(defaultCellSpan), containerWidth, currentCardsPerRow),
        height: Math.max(dynamicMinCardHeight, Math.min(calculateCardWidth(Math.round(defaultCellSpan), containerWidth, currentCardsPerRow) * 0.6, dynamicMaxCardHeight)),
        gridPosition: {
          row: Math.floor(index / currentCardsPerRow),
          col: index % currentCardsPerRow
        },
        subPosition: undefined, // Clear any sub-positioning
        isResizing: false // Ensure clean state
      }))
      
      setVideoCards(resetCards)
      
      // Reorganize grid rows with reset cards
      const { rows } = organizeCardsIntoRows(resetCards, containerWidth)
      setGridRows(rows)
      
      // Clear sub-spaces since all cards are back in main grid
      setAvailableSubSpaces([])
    }
  }, [originalVideoCards, organizeCardsIntoRows, calculateCardWidth, containerWidth, currentCardsPerRow, dynamicMinCardHeight, dynamicMaxCardHeight, defaultCellSpan])

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

        {/* Render centered preview grid during resize */}
        {isResizing && previewGridRows.length > 0 && (
          <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-white bg-opacity-20">
            <div className="space-y-4 max-w-6xl max-h-[80vh] overflow-auto">
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 text-center">
                <span className="text-blue-700 font-medium text-sm">Preview: Release mouse to apply</span>
              </div>
              {previewGridRows.slice(0, 5).map((row, rowIndex) => (
                <div 
                  key={`preview-row-${rowIndex}`}
                  className="flex items-start opacity-60"
                  style={{ display: 'flex', paddingLeft: `${containerPadding}px`, paddingRight: `${containerPadding}px`, gap: `${cardGap}px` }}
                >
                  {row.map((cardData, cardIndex) => (
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
              {previewGridRows.length > 5 && (
                <div className="text-center text-gray-500 text-sm py-2">
                  ... and {previewGridRows.length - 5} more rows
                </div>
              )}
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
              style={{ display: 'flex', overflow: 'hidden', gap: `${cardGap}px` }}
              onDragOver={(e) => handleRowDragOver(e, rowIndex)}
              onDragLeave={handleRowDragLeave}
              onDrop={(e) => handleRowDrop(e, rowIndex)}
            >
              {row.map((cardData, cardIndex) => (
                <div
                  key={cardData.video.id}
                  className={`flex-shrink-0 transition-all duration-300 relative ${
                    cardData.isResizing ? 'z-50' : 'z-10'
                  }`}
                  style={{ 
                    flexShrink: 0, // Prevent cards from shrinking which could cause overlap
                    minWidth: 0, // Prevent flex item from overflowing
                    width: cardData.width // Force the calculated width
                  }}
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
                    minWidth={dynamicMinCardWidth}
                    minHeight={dynamicMinCardHeight}
                    maxWidth={dynamicMaxCardWidth}
                    maxHeight={dynamicMaxCardHeight}
                    gridPosition={cardData.gridPosition}
                    isDragging={draggedCardId === cardData.video.id}
                    isDropTarget={dropTargetCardId === cardData.video.id}
                  />
                  
                  {/* Sub-space indicators - show available vertical space below cards */}
                  {draggedCardId && draggedCardId !== cardData.video.id && (
                    availableSubSpaces
                      .filter(subSpace => subSpace.parentCardId === cardData.video.id)
                      .map(subSpace => {
                        const isDropTarget = dropTargetSubSpace?.parentCardId === cardData.video.id
                        return (
                          <div
                            key={`subspace-${subSpace.parentCardId}`}
                            className={`absolute border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
                              isDropTarget 
                                ? 'border-purple-400 bg-purple-50' 
                                : 'border-purple-300 bg-purple-25 hover:border-purple-400 hover:bg-purple-50'
                            }`}
                            style={{
                              top: subSpace.offsetY,
                              left: 0,
                              width: subSpace.availableWidth,
                              height: Math.min(subSpace.availableHeight, 200), // Cap visual height
                            }}
                            onDragOver={(e) => handleSubSpaceDragOver(e, subSpace)}
                            onDragLeave={handleSubSpaceDragLeave}
                            onDrop={(e) => handleSubSpaceDrop(e, subSpace)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-center text-purple-700">
                                <div className="text-xs font-medium">Sub-space available</div>
                                <div className="text-xs opacity-75">
                                  {Math.round(subSpace.availableHeight)}px × {Math.round(subSpace.availableWidth)}px
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  )}

                  {/* Render sub-positioned cards below this parent card */}
                  {videoCards
                    .filter(subCard => subCard.subPosition?.parentCardId === cardData.video.id)
                    .map(subCard => (
                      <div
                        key={`sub-${subCard.video.id}`}
                        className={`absolute transition-all duration-300 ${
                          subCard.isResizing ? 'z-50' : 'z-20'
                        }`}
                        style={{
                          top: subCard.subPosition!.offsetY,
                          left: 0,
                        }}
                      >
                        <ResizableVideoCard
                          video={subCard.video}
                          onVideoUpdate={onVideoUpdate}
                          onResize={handleCardResize}
                          onResizeStart={handleCardResizeStart}
                          onResizeStop={handleCardResizeStop}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => {
                            handleDragOver(e)
                            handleCardDragOver(subCard.video.id)
                          }}
                          onDragLeave={handleCardDragLeave}
                          onDrop={handleDrop}
                          defaultWidth={subCard.width}
                          defaultHeight={subCard.height}
                          minWidth={dynamicMinCardWidth * 0.7} // Allow smaller in sub-spaces
                          minHeight={dynamicMinCardHeight * 0.7}
                          maxWidth={dynamicMaxCardWidth}
                          maxHeight={dynamicMaxCardHeight}
                          gridPosition={subCard.gridPosition}
                          isDragging={draggedCardId === subCard.video.id}
                          isDropTarget={dropTargetCardId === subCard.video.id}
                        />
                      </div>
                    ))}
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
              {currentCardsPerRow} (responsive: {containerWidth < 768 ? 'mobile' : containerWidth < 1200 ? 'tablet' : 'desktop'})
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