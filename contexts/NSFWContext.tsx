'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface NSFWContextType {
  // New global blur control
  isNSFWBlurred: boolean
  setIsNSFWBlurred: (blurred: boolean) => void
  toggleNSFWBlur: () => void
  // Legacy compatibility for existing video card functionality
  globalBlurEnabled: boolean
  isVideoRevealed: (videoId: string) => boolean
  revealVideo: (videoId: string) => void
  hideVideo: (videoId: string) => void
  toggleVideoReveal: (videoId: string) => void
}

const NSFWContext = createContext<NSFWContextType | undefined>(undefined)

interface NSFWProviderProps {
  children: ReactNode
}

export function NSFWProvider({ children }: NSFWProviderProps) {
  const [isNSFWBlurred, setIsNSFWBlurred] = useState(true)
  const [revealedVideos, setRevealedVideos] = useState<Set<string>>(new Set())

  const toggleNSFWBlur = () => {
    setIsNSFWBlurred(prev => {
      const newBlurState = !prev
      // If turning blur ON, clear all revealed videos to re-blur them
      if (newBlurState) {
        setRevealedVideos(new Set())
      }
      return newBlurState
    })
  }

  const isVideoRevealed = (videoId: string): boolean => {
    return revealedVideos.has(videoId)
  }

  const revealVideo = (videoId: string) => {
    setRevealedVideos(prev => new Set([...prev, videoId]))
  }

  const hideVideo = (videoId: string) => {
    setRevealedVideos(prev => {
      const newSet = new Set(prev)
      newSet.delete(videoId)
      return newSet
    })
  }

  const toggleVideoReveal = (videoId: string) => {
    if (isVideoRevealed(videoId)) {
      hideVideo(videoId)
    } else {
      revealVideo(videoId)
    }
  }

  return (
    <NSFWContext.Provider
      value={{
        // New interface
        isNSFWBlurred,
        setIsNSFWBlurred,
        toggleNSFWBlur,
        // Legacy compatibility
        globalBlurEnabled: isNSFWBlurred,
        isVideoRevealed,
        revealVideo,
        hideVideo,
        toggleVideoReveal
      }}
    >
      {children}
    </NSFWContext.Provider>
  )
}

export function useNSFW() {
  const context = useContext(NSFWContext)
  if (context === undefined) {
    throw new Error('useNSFW must be used within a NSFWProvider')
  }
  return context
}