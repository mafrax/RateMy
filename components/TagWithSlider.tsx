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
  
  // Track when props change
  useEffect(() => {
    console.log(`🏷️ TagWithSlider ${tag.name} (${tag.id}): userRating=${userRating}, avgRating=${avgRating.toFixed(1)}, pending=${isPending}`)
  }, [tag.id, tag.name, userRating, avgRating, isPending])
  
  // Update tempRating when userRating changes (important for tracking visual reverts)
  useEffect(() => {
    if (!isDragging && tempRating !== userRating) {
      console.log(`🔄 TagWithSlider ${tag.name}: updating tempRating from ${tempRating} to ${userRating} (userRating prop changed)`)
      setTempRating(userRating)
    }
  }, [userRating, isDragging, tempRating, tag.name])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRating = parseFloat(e.target.value)
    console.log(`🎚️ TagWithSlider ${tag.name}: tempRating changed from ${tempRating} to ${newRating}`)
    setTempRating(newRating)
  }

  const handleMouseDown = () => {
    console.log(`👇 TagWithSlider ${tag.name}: drag started`)
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    if (isDragging && tempRating !== userRating) {
      console.log(`👆 TagWithSlider ${tag.name}: submitting rating ${tempRating} (was ${userRating})`)
      onRate(tag.id, tempRating)
    } else {
      console.log(`👆 TagWithSlider ${tag.name}: no rating change (${tempRating} === ${userRating})`)
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
          {/* Background Track with Gradient - centered */}
          <div className={`absolute top-1/2 -translate-y-1/2 rounded-full ${
            compact ? 'left-1 right-1 h-1.5' : 'left-2 right-2 h-2'
          }`}
            style={{
              background: 'linear-gradient(to right, #dc2626 0%, #ea580c 25%, #d97706 50%, #65a30d 75%, #16a34a 100%)',
              filter: 'brightness(1.1) contrast(1.1)'
            }}
          >
            {/* User Rating Overlay */}
            {(isDragging ? tempRating : userRating) > 0 && (
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                  isPending 
                    ? 'bg-white/40 dark:bg-black/40' 
                    : 'bg-white/30 dark:bg-black/30'
                } border-r-2 ${isPending ? 'border-blue-400' : 'border-blue-500'}`}
                style={{ width: `${((isDragging ? tempRating : userRating) / 5) * 100}%` }}
                title={`Your rating: ${(isDragging ? tempRating : userRating).toFixed(1)}${isPending ? ' (pending)' : ''}`}
              />
            )}
            
            {/* Average Rating Vertical Marker */}
            {avgRating > 0 && (
              <div 
                className={`absolute rounded-full border-2 border-white shadow-md ${
                  compact ? 'w-1 -top-1.5 h-5' : 'w-1.5 -top-2.5 h-7'
                }`}
                style={{ 
                  left: `calc(${(avgRating / 5) * 100}% - ${compact ? '2px' : '3px'})`,
                  background: '#000000',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
                }}
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
          width: ${compact ? '14px' : '18px'};
          height: ${compact ? '14px' : '18px'};
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3b82f6;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(59,130,246,0.2);
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          border-color: #2563eb;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(37,99,235,0.3);
          transform: scale(1.1);
        }
        
        .slider-thumb::-moz-range-thumb {
          appearance: none;
          width: ${compact ? '14px' : '18px'};
          height: ${compact ? '14px' : '18px'};
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3b82f6;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(59,130,246,0.2);
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          border-color: #2563eb;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(37,99,235,0.3);
          transform: scale(1.1);
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