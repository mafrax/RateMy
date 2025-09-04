'use client'

import React from 'react'

interface NSFWBlurOverlayProps {
  isNSFW?: boolean
  children: React.ReactNode
  className?: string
  onReveal?: () => void
}

export function NSFWBlurOverlay({ 
  isNSFW = false, 
  children, 
  className = '',
  onReveal
}: NSFWBlurOverlayProps) {
  // Always blur if this component is being used (since it's only used when shouldBlur is true)
  const shouldBlur = isNSFW

  return (
    <div className={`relative ${className}`}>
      <div className={shouldBlur ? 'blur-lg' : ''}>
        {children}
      </div>
      {shouldBlur && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <button
            onClick={onReveal}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Click to view NSFW content
          </button>
        </div>
      )}
    </div>
  )
}