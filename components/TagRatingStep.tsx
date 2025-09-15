'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface Tag {
  name: string
  rating: number
}

interface TagRatingStepProps {
  extractedTags: string[]
  videoTitle: string
  videoThumbnail?: string
  onComplete: (ratedTags: Tag[]) => void
  onBack: () => void
  isSubmitting?: boolean
}

export function TagRatingStep({
  extractedTags,
  videoTitle,
  videoThumbnail,
  onComplete,
  onBack,
  isSubmitting = false
}: TagRatingStepProps) {
  const [allTags, setAllTags] = useState<string[]>(extractedTags)
  const [tagRatings, setTagRatings] = useState<Record<string, number>>(
    extractedTags.reduce((acc, tag) => ({ ...acc, [tag]: 1 }), {}) // Start with rating 1 (low relevance)
  )
  const [skippedTags, setSkippedTags] = useState<Set<string>>(new Set())
  const [newTagInput, setNewTagInput] = useState<string>('')

  const handleRatingChange = (tagName: string, rating: number) => {
    setTagRatings(prev => ({ ...prev, [tagName]: rating }))
    // Remove from skipped tags if user rates it
    if (skippedTags.has(tagName)) {
      setSkippedTags(prev => {
        const newSet = new Set(prev)
        newSet.delete(tagName)
        return newSet
      })
    }
  }

  const handleSkipTag = (tagName: string) => {
    setSkippedTags(prev => new Set(prev).add(tagName))
  }

  const handleAddTag = () => {
    const tagName = newTagInput.trim().toLowerCase()
    if (tagName && !allTags.includes(tagName) && tagName.length >= 2 && tagName.length <= 50) {
      setAllTags(prev => [...prev, tagName])
      setTagRatings(prev => ({ ...prev, [tagName]: 1 })) // Default rating for new tags
      setNewTagInput('')
      toast.success(`Added tag: ${tagName}`)
    } else if (allTags.includes(tagName)) {
      toast.error('Tag already exists')
    } else if (tagName.length < 2 || tagName.length > 50) {
      toast.error('Tag must be between 2 and 50 characters')
    }
  }

  const handleSubmit = () => {
    const ratedTags: Tag[] = allTags
      .filter(tagName => !skippedTags.has(tagName)) // Only include non-skipped tags
      .map(tagName => ({
        name: tagName,
        rating: tagRatings[tagName] !== undefined ? tagRatings[tagName] : 1
      }))

    // Check if at least some tags are rated (not skipped)
    const hasRatings = ratedTags.length > 0
    if (!hasRatings) {
      toast.error('Please rate at least one tag or skip fewer tags')
      return
    }

    onComplete(ratedTags)
  }

  const getRatingColor = (rating: number) => {
    if (rating === 0) return 'bg-gray-400'
    if (rating <= 2) return 'bg-red-400'
    if (rating <= 3) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  const getTotalRatedTags = () => {
    return allTags.length - skippedTags.size // Total minus skipped
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Rate Tags for Your Video
            </h1>
            <p className="text-gray-600 text-center">
              We extracted {extractedTags.length} tags for your video. Rate how relevant each tag is (0-5 scale) or add your own custom tags.
            </p>
          </div>

          {/* Video Info */}
          <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              {videoThumbnail && (
                <div className="flex-shrink-0">
                  <img
                    src={videoThumbnail}
                    alt={videoTitle}
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {videoTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Rate tags based on how well they describe this video content
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Progress: {getTotalRatedTags()} of {allTags.length} tags rated
              </span>
              <span className="text-blue-600 font-medium">
                {Math.round((getTotalRatedTags() / allTags.length) * 100)}% Complete
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getTotalRatedTags() / allTags.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Add Custom Tag Section */}
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Add Custom Tag
                </label>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Enter a custom tag (e.g., comedy, tutorial, review)"
                  className="w-full px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!newTagInput.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Tag
              </button>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Add tags that better describe your video content
            </p>
          </div>

          {/* Tags Rating Grid */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTags.map((tagName) => (
                <div
                  key={tagName}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 capitalize">
                      {tagName.replace(/-/g, ' ')}
                    </h3>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium text-white
                      ${skippedTags.has(tagName) ? 'bg-gray-600' : getRatingColor(tagRatings[tagName] !== undefined ? tagRatings[tagName] : 1)}
                    `}>
                      {skippedTags.has(tagName) ? 'Skipped' : (tagRatings[tagName] !== undefined ? tagRatings[tagName] : 1)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm text-gray-600">
                        How relevant is this tag?
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSkipTag(tagName)}
                        className={`
                          px-2 py-1 rounded text-xs font-medium transition-all
                          ${skippedTags.has(tagName)
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {skippedTags.has(tagName) ? 'Skipped' : 'Skip'}
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Simple range slider - no overlay complexity */}
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={skippedTags.has(tagName) ? 0 : (tagRatings[tagName] !== undefined ? tagRatings[tagName] : 1)}
                        onChange={(e) => handleRatingChange(tagName, parseFloat(e.target.value))}
                        disabled={skippedTags.has(tagName)}
                        className="simple-rating-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                      />
                      
                      {/* Rating labels */}
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                      </div>
                      
                      {/* Current rating display */}
                      {!skippedTags.has(tagName) && (
                        <div className="text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            (tagRatings[tagName] !== undefined ? tagRatings[tagName] : 1) === 0 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            Rating: {tagRatings[tagName] !== undefined ? tagRatings[tagName] : 1}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      Rate from 0 (not relevant) to 5 (very relevant) • Use Skip to ignore this tag
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allTags.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No tags were extracted for this video.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  You can still complete the upload without tag ratings.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Back to Edit
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => onComplete([])}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Skip Rating
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : `Complete Upload (${getTotalRatedTags()} tags rated)`}
                </button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Why rate tags?
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your ratings help improve our tag extraction system and make it easier for others to find relevant content. 
                    Higher ratings indicate the tag accurately describes the video content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for the sliders */}
      <style jsx>{`
        :global(.simple-rating-slider) {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
          background: linear-gradient(to right, #ddd 0%, #ddd 100%);
        }
        
        :global(.simple-rating-slider::-webkit-slider-thumb) {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: grab;
        }
        
        :global(.simple-rating-slider::-webkit-slider-thumb:active) {
          cursor: grabbing;
          background: #2563eb;
        }
        
        :global(.simple-rating-slider::-moz-range-thumb) {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: grab;
        }
        
        :global(.simple-rating-slider::-moz-range-thumb:active) {
          cursor: grabbing;
          background: #2563eb;
        }
        
        :global(.simple-rating-slider:disabled) {
          opacity: 0.5;
        }
        
        :global(.simple-rating-slider:disabled::-webkit-slider-thumb) {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        :global(.simple-rating-slider:disabled::-moz-range-thumb) {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}