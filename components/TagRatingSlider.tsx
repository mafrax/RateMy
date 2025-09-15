'use client'

import React from 'react'

interface TagRatingSliderProps {
  tagId: string
  userRating: number
  avgRating: number
  isPending: boolean
  onRate: (tagId: string, rating: number) => void
  disabled?: boolean
}

export function TagRatingSlider({ 
  tagId, 
  userRating, 
  avgRating, 
  isPending, 
  onRate, 
  disabled = false 
}: TagRatingSliderProps) {
  // Log when visual rating value changes
  React.useEffect(() => {
    console.log(`📊 TagRatingSlider VISUAL UPDATE: ${tagId} = ${userRating} (pending: ${isPending})`)
  }, [tagId, userRating, isPending])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRating = parseFloat(e.target.value)
    console.log(`🎚️ SLIDER CHANGED: ${tagId} from ${userRating} to ${newRating}`)
    onRate(tagId, newRating)
  }

  return (
    <div className="flex items-center space-x-2 w-full">
      {/* Slider Container */}
      <div className="relative flex-1">
        {/* Background Track */}
        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full relative overflow-hidden">
          {/* Average Rating Bar (Background) */}
          <div 
            className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full transition-all duration-200"
            style={{ width: `${(avgRating / 5) * 100}%` }}
          />
          
          {/* User Rating Bar (Overlay) */}
          {userRating > 0 && (
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-200 ${
                isPending ? 'bg-orange-400' : 'bg-orange-500'
              }`}
              style={{ width: `${(userRating / 5) * 100}%` }}
            />
          )}
        </div>
        
        {/* Range Input */}
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={userRating}
          onChange={handleSliderChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
      
      {/* Rating Display */}
      <div className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px] text-right">
        <div>Avg: {avgRating.toFixed(1)}</div>
        {userRating > 0 && (
          <div className={isPending ? 'text-orange-500' : 'text-orange-600'}>
            You: {userRating.toFixed(1)}{isPending ? '*' : ''}
          </div>
        )}
      </div>
    </div>
  )
}