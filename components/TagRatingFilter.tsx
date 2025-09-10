'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { DualRangeSlider } from './DualRangeSlider'

interface TagRatingFilterProps {
  tagName: string
  minRating: number
  maxRating: number
  onApply: (tagName: string, minRating: number, maxRating: number) => void
}

export function TagRatingFilter({ tagName, minRating, maxRating, onApply }: TagRatingFilterProps) {
  const [localMinRating, setLocalMinRating] = useState(minRating)
  const [localMaxRating, setLocalMaxRating] = useState(maxRating)
  const [isChanged, setIsChanged] = useState(false)

  const handleSliderChange = (minValue: number, maxValue: number) => {
    setLocalMinRating(minValue)
    setLocalMaxRating(maxValue)
    setIsChanged(minValue !== minRating || maxValue !== maxRating)
  }

  const handleApply = () => {
    onApply(tagName, localMinRating, localMaxRating)
    setIsChanged(false)
  }

  return (
    <div className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-center gap-4">
        {/* Tag Name */}
        <div className="flex-shrink-0 min-w-[140px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {tagName}
            </span>
          </div>
        </div>

        {/* Range Slider Container */}
        <div className="flex-1 min-w-0 px-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800">
            <DualRangeSlider
              min={1}
              max={5}
              step={0.1}
              initialMinValue={localMinRating}
              initialMaxValue={localMaxRating}
              onChange={handleSliderChange}
              showAverage={false}
              compact={true}
            />
          </div>
        </div>

        {/* Rating Display */}
        <div className="flex items-center space-x-2 min-w-[100px]">
          <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
            <StarIcon className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {localMinRating.toFixed(1)} - {localMaxRating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={!isChanged}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform ${
            isChanged
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-600'
          }`}
        >
          {isChanged ? (
            <div className="flex items-center space-x-1">
              <span>Apply</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          ) : (
            'Apply'
          )}
        </button>
      </div>
    </div>
  )
}