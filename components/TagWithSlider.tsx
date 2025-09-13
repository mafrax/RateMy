'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface TagWithSliderProps {
  tag: {
    id: string
    name: string
  }
  userRating: number
  avgRating: number
  isPending: boolean
  onRate: (tagId: string, rating: number) => void
  onRemoveTag?: (tagId: string) => void
  disabled?: boolean
  canRemove?: boolean
  compact?: boolean
}

export function TagWithSlider({ 
  tag,
  userRating,
  avgRating,
  isPending,
  onRate,
  onRemoveTag,
  disabled = false,
  canRemove = false,
  compact = false
}: TagWithSliderProps) {
  const [tempRating, setTempRating] = useState(userRating)
  const [isDragging, setIsDragging] = useState(false)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRating = parseFloat(e.target.value)
    setTempRating(newRating)
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    if (isDragging && tempRating !== userRating) {
      onRate(tag.id, tempRating)
    }
    setIsDragging(false)
  }

  const handleTouchStart = () => {
    setIsDragging(true)
  }

  const handleTouchEnd = () => {
    if (isDragging && tempRating !== userRating) {
      onRate(tag.id, tempRating)
    }
    setIsDragging(false)
  }

  // Update temp rating when user rating changes from external source
  useEffect(() => {
    if (!isDragging) {
      setTempRating(userRating)
    }
  }, [userRating, isDragging])

  const handleRemoveClick = () => {
    if (onRemoveTag) {
      onRemoveTag(tag.id)
    }
  }

  return (
    <div 
      className={`flex items-center transition-colors slider-no-drag ${
        compact 
          ? 'space-x-1 py-1 px-1.5' 
          : 'space-x-3 py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      data-no-drag="true"
    >
      {/* Tag Name and Remove Button */}
      {!compact && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {tag.name}
          </span>
          {canRemove && onRemoveTag && (
            <button
              onClick={handleRemoveClick}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              title="Remove tag"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Slider Container */}
      <div className="flex-1 min-w-0">
        <div className={`relative ${compact ? 'px-1 py-1.5' : 'px-2 py-3'}`}>
          {/* Background Track - centered */}
          <div className={`absolute top-1/2 -translate-y-1/2 bg-gray-200 dark:bg-gray-700 rounded-full ${
            compact ? 'left-1 right-1 h-1.5' : 'left-2 right-2 h-2'
          }`}>
            {/* User Rating Bar */}
            {(isDragging ? tempRating : userRating) > 0 && (
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                  isPending 
                    ? 'bg-blue-400' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${((isDragging ? tempRating : userRating) / 5) * 100}%` }}
                title={`Your rating: ${(isDragging ? tempRating : userRating).toFixed(1)}${isPending ? ' (pending)' : ''}`}
              />
            )}
            
            {/* Average Rating Vertical Marker */}
            {avgRating > 0 && (
              <div 
                className={`absolute w-0.5 bg-red-500 rounded-full ${
                  compact ? '-top-1 h-4' : '-top-2 h-6'
                }`}
                style={{ left: `calc(${(avgRating / 5) * 100}% - 1px)` }}
                title={`Average rating: ${avgRating.toFixed(1)}`}
              />
            )}
          </div>
          
          {/* Visible Range Slider */}
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={isDragging ? tempRating : userRating}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            disabled={disabled}
            className={`absolute top-0 h-full appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed slider-thumb z-10 ${
              compact ? 'left-1 right-1' : 'left-2 right-2'
            }`}
          />
        </div>
        
        {/* Rating Display */}
        {!compact && (
          <div className="flex justify-between items-center text-xs mt-1 px-2">
            <span className="text-red-600 dark:text-red-400">
              Avg: {avgRating.toFixed(1)}
            </span>
            {(isDragging ? tempRating : userRating) > 0 && (
              <span className={isPending ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'}>
                You: {(isDragging ? tempRating : userRating).toFixed(1)}{isPending && '*'}
              </span>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .slider-no-drag {
          -webkit-user-drag: none;
          user-drag: none;
          -webkit-user-select: none;
          user-select: none;
          pointer-events: none;
        }
        
        .slider-no-drag * {
          -webkit-user-drag: none;
          user-drag: none;
          pointer-events: auto;
        }
        
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: ${compact ? '12px' : '16px'};
          height: ${compact ? '12px' : '16px'};
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
          pointer-events: auto;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          background: #2563eb;
        }
        
        .slider-thumb::-moz-range-thumb {
          appearance: none;
          width: ${compact ? '12px' : '16px'};
          height: ${compact ? '12px' : '16px'};
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
          pointer-events: auto;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          background: #2563eb;
        }
        
        .slider-thumb::-moz-range-track {
          background: transparent;
          height: 8px;
        }
        
        .slider-thumb::-webkit-slider-track {
          background: transparent;
          height: 8px;
        }
      `}</style>
    </div>
  )
}