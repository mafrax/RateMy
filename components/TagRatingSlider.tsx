'use client'

import React, { useState, useEffect } from 'react'

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
  const [tempRating, setTempRating] = useState(userRating)
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  
  // Log when visual rating value changes
  React.useEffect(() => {
    console.log(`📊 TagRatingSlider VISUAL UPDATE: ${tagId} = ${userRating} (pending: ${isPending})`)
  }, [tagId, userRating, isPending])

  // Update tempRating when userRating changes, but resist changes right after submission
  useEffect(() => {
    const timeSinceLastSubmit = Date.now() - lastSubmitTime
    
    if (tempRating !== userRating) {
      // If user recently submitted a rating (within 15 seconds), resist external changes
      if (timeSinceLastSubmit < 15000 && lastSubmitTime > 0) {
        console.log(`🛡️ TagRatingSlider ${tagId}: RESISTING userRating change from ${userRating} to ${tempRating} (${(timeSinceLastSubmit/1000).toFixed(1)}s since submit)`)
        return
      }
      
      console.log(`🔄 TagRatingSlider ${tagId}: updating tempRating from ${tempRating} to ${userRating}`)
      setTempRating(userRating)
    }
  }, [userRating, tempRating, tagId, lastSubmitTime])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRating = parseFloat(e.target.value)
    console.log(`🎚️ TagRatingSlider ${tagId}: tempRating changed from ${tempRating} to ${newRating}`)
    setTempRating(newRating)
    setLastSubmitTime(Date.now()) // Record submission time
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
          {tempRating > 0 && (
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-200 ${
                isPending ? 'bg-orange-400' : 'bg-orange-500'
              }`}
              style={{ width: `${(tempRating / 5) * 100}%` }}
            />
          )}
        </div>
        
        {/* Range Input */}
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={tempRating}
          onChange={handleSliderChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
      
      {/* Rating Display */}
      <div className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px] text-right">
        <div>Avg: {avgRating.toFixed(1)}</div>
        {tempRating > 0 && (
          <div className={isPending ? 'text-orange-500' : 'text-orange-600'}>
            You: {tempRating.toFixed(1)}{isPending ? '*' : ''}
          </div>
        )}
      </div>
    </div>
  )
}