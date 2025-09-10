'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

interface DualRangeSliderProps {
  min?: number
  max?: number
  step?: number
  initialMinValue?: number
  initialMaxValue?: number
  onChange?: (minValue: number, maxValue: number) => void
  averageValue?: number
  showAverage?: boolean
  compact?: boolean
  micro?: boolean
}

export function DualRangeSlider({
  min = 0,
  max = 10,
  step = 0.1,
  initialMinValue = 2,
  initialMaxValue = 8,
  onChange,
  averageValue = 7.3,
  showAverage = true,
  compact = false,
  micro = false
}: DualRangeSliderProps) {
  const [minValue, setMinValue] = useState(initialMinValue)
  const [maxValue, setMaxValue] = useState(initialMaxValue)
  
  // Update values when initial props change
  useEffect(() => {
    setMinValue(initialMinValue)
    setMaxValue(initialMaxValue)
  }, [initialMinValue, initialMaxValue])
  const [isDraggingMin, setIsDraggingMin] = useState(false)
  const [isDraggingMax, setIsDraggingMax] = useState(false)
  
  const sliderRef = useRef<HTMLDivElement>(null)
  
  // Convert value to percentage position
  const getPercentage = useCallback((value: number) => {
    return ((value - min) / (max - min)) * 100
  }, [min, max])
  
  // Convert percentage to value with step precision
  const getValueFromPercentage = useCallback((percentage: number) => {
    const rawValue = min + (percentage / 100) * (max - min)
    return Math.round(rawValue / step) * step
  }, [min, max, step])
  
  // Get mouse position relative to slider
  const getRelativePosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return 0
    
    const rect = sliderRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const percentage = (relativeX / rect.width) * 100
    
    return Math.max(0, Math.min(100, percentage))
  }, [])
  
  // Handle mouse down on thumbs
  const handleMinThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingMin(true)
  }, [])
  
  const handleMaxThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingMax(true)
  }, [])
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingMin && !isDraggingMax) return
    
    const percentage = getRelativePosition(e.clientX)
    const newValue = getValueFromPercentage(percentage)
    
    if (isDraggingMin) {
      const clampedValue = Math.min(newValue, maxValue - step)
      const finalValue = Math.max(min, clampedValue)
      setMinValue(finalValue)
      onChange?.(finalValue, maxValue)
    } else if (isDraggingMax) {
      const clampedValue = Math.max(newValue, minValue + step)
      const finalValue = Math.min(max, clampedValue)
      setMaxValue(finalValue)
      onChange?.(minValue, finalValue)
    }
  }, [isDraggingMin, isDraggingMax, getRelativePosition, getValueFromPercentage, minValue, maxValue, min, max, step, onChange])
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDraggingMin(false)
    setIsDraggingMax(false)
  }, [])
  
  // Handle track click
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingMin || isDraggingMax) return
    
    const percentage = getRelativePosition(e.clientX)
    const clickValue = getValueFromPercentage(percentage)
    
    // Determine which thumb is closer to the click
    const distanceToMin = Math.abs(clickValue - minValue)
    const distanceToMax = Math.abs(clickValue - maxValue)
    
    if (distanceToMin <= distanceToMax) {
      const clampedValue = Math.min(clickValue, maxValue - step)
      const finalValue = Math.max(min, clampedValue)
      setMinValue(finalValue)
      onChange?.(finalValue, maxValue)
    } else {
      const clampedValue = Math.max(clickValue, minValue + step)
      const finalValue = Math.min(max, clampedValue)
      setMaxValue(finalValue)
      onChange?.(minValue, finalValue)
    }
  }, [isDraggingMin, isDraggingMax, getRelativePosition, getValueFromPercentage, minValue, maxValue, min, max, step, onChange])
  
  // Mouse event listeners
  useEffect(() => {
    if (isDraggingMin || isDraggingMax) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingMin, isDraggingMax, handleMouseMove, handleMouseUp])
  
  const minPercentage = getPercentage(minValue)
  const maxPercentage = getPercentage(maxValue)
  const averagePercentage = getPercentage(averageValue)
  
  if (micro) {
    return (
      <div className="w-16 px-0.5">
        {/* Micro Slider Container */}
        <div className="relative py-1">
          {/* Track */}
          <div
            ref={sliderRef}
            className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
            onClick={handleTrackClick}
          >
            {/* Active Range */}
            <div
              className="absolute h-1.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              style={{
                left: `${minPercentage}%`,
                width: `${Math.max(1, maxPercentage - minPercentage)}%`
              }}
            />
            
            {/* Average Value Marker */}
            {showAverage && averageValue >= min && averageValue <= max && (
              <div
                className="absolute w-0.5 h-4 bg-orange-500 transform -translate-y-1.5 shadow-sm z-10 pointer-events-none rounded-full"
                style={{ left: `calc(${Math.min(Math.max(averagePercentage, 0), 100)}% - 1px)` }}
              />
            )}
            
            {/* Min Thumb */}
            <div
              className={`absolute w-3 h-3 bg-blue-600 border border-white rounded-full shadow-sm cursor-grab transform -translate-y-0.75 -translate-x-1.5 transition-all duration-200 z-20 ${
                isDraggingMin ? 'scale-125 cursor-grabbing shadow-md' : 'hover:scale-110'
              }`}
              style={{ left: `${minPercentage}%` }}
              onMouseDown={handleMinThumbMouseDown}
            />
            
            {/* Max Thumb */}
            <div
              className={`absolute w-3 h-3 bg-green-600 border border-white rounded-full shadow-sm cursor-grab transform -translate-y-0.75 -translate-x-1.5 transition-all duration-200 z-20 ${
                isDraggingMax ? 'scale-125 cursor-grabbing shadow-md' : 'hover:scale-110'
              }`}
              style={{ left: `${maxPercentage}%` }}
              onMouseDown={handleMaxThumbMouseDown}
            />
          </div>
          
          {/* Micro Value Display */}
          <div className="flex justify-between mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-none">
            <span>{minValue.toFixed(1)}</span>
            <span>{maxValue.toFixed(1)}</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (compact) {
    return (
      <div className="w-full px-2">
        {/* Compact Slider Container */}
        <div className="relative mb-2">
          {/* Track */}
          <div
            ref={sliderRef}
            className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
            onClick={handleTrackClick}
          >
            {/* Active Range */}
            <div
              className="absolute h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              style={{
                left: `${minPercentage}%`,
                width: `${maxPercentage - minPercentage}%`
              }}
            />
            
            {/* Min Thumb */}
            <div
              className={`absolute w-4 h-4 bg-blue-600 border border-white rounded-full shadow cursor-grab transform -translate-y-1 transition-all duration-200 ${
                isDraggingMin ? 'scale-110 cursor-grabbing shadow-md' : 'hover:scale-105'
              }`}
              style={{ left: `calc(${minPercentage}% - 8px)` }}
              onMouseDown={handleMinThumbMouseDown}
            />
            
            {/* Max Thumb */}
            <div
              className={`absolute w-4 h-4 bg-green-600 border border-white rounded-full shadow cursor-grab transform -translate-y-1 transition-all duration-200 ${
                isDraggingMax ? 'scale-110 cursor-grabbing shadow-md' : 'hover:scale-105'
              }`}
              style={{ left: `calc(${maxPercentage}% - 8px)` }}
              onMouseDown={handleMaxThumbMouseDown}
            />
            
            {/* Average Value Marker */}
            {showAverage && averageValue >= min && averageValue <= max && (
              <div
                className="absolute w-0.5 h-6 bg-orange-500 transform -translate-y-2 shadow-sm z-10 pointer-events-none"
                style={{ left: `calc(${Math.min(Math.max(averagePercentage, 0), 100)}% - 1px)` }}
              />
            )}
          </div>
          
          {/* Compact Value Display */}
          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>{minValue.toFixed(1)}⭐</span>
            <span>{maxValue.toFixed(1)}⭐</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      {/* Value Display */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Minimum Value
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {minValue.toFixed(1)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Range
          </div>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {minValue.toFixed(1)} - {maxValue.toFixed(1)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Maximum Value
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {maxValue.toFixed(1)}
          </div>
        </div>
      </div>
      
      {/* Slider Container */}
      <div className="relative">
        {/* Track */}
        <div
          ref={sliderRef}
          className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Active Range */}
          <div
            className="absolute h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
          
          {/* Min Thumb */}
          <div
            className={`absolute w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg cursor-grab transform -translate-y-1.5 transition-all duration-200 ${
              isDraggingMin ? 'scale-110 cursor-grabbing shadow-xl' : 'hover:scale-105'
            }`}
            style={{ left: `calc(${minPercentage}% - 12px)` }}
            onMouseDown={handleMinThumbMouseDown}
          >
            {/* Min Thumb Value Tooltip */}
            <div className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-blue-600 text-white text-xs rounded whitespace-nowrap transition-opacity duration-200 ${
              isDraggingMin ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}>
              {minValue.toFixed(1)}
            </div>
          </div>
          
          {/* Max Thumb */}
          <div
            className={`absolute w-6 h-6 bg-green-600 border-2 border-white rounded-full shadow-lg cursor-grab transform -translate-y-1.5 transition-all duration-200 ${
              isDraggingMax ? 'scale-110 cursor-grabbing shadow-xl' : 'hover:scale-105'
            }`}
            style={{ left: `calc(${maxPercentage}% - 12px)` }}
            onMouseDown={handleMaxThumbMouseDown}
          >
            {/* Max Thumb Value Tooltip */}
            <div className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap transition-opacity duration-200 ${
              isDraggingMax ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}>
              {maxValue.toFixed(1)}
            </div>
          </div>
          
          {/* Average Value Marker */}
          {showAverage && averageValue >= min && averageValue <= max && (
            <div
              className="absolute w-1 h-8 bg-orange-500 transform -translate-y-2.5 shadow-md z-10 pointer-events-none"
              style={{ left: `calc(${Math.min(Math.max(averagePercentage, 0), 100)}% - 2px)` }}
            >
              {/* Average Value Label */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-orange-500 text-white text-xs rounded whitespace-nowrap pointer-events-none">
                Avg: {averageValue.toFixed(1)}
              </div>
            </div>
          )}
        </div>
        
        {/* Range Labels */}
        <div className="flex justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Drag the thumbs to adjust the range • Step: {step} • Click on track to move nearest thumb</p>
      </div>
    </div>
  )
}