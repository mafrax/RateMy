'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface PendingRating {
  videoId: string
  tagId: string
  rating: number
  timestamp: number
}

interface RatingCacheContextType {
  pendingRatings: Map<string, PendingRating>
  setCachedRating: (videoId: string, tagId: string, rating: number) => void
  getCachedRating: (videoId: string, tagId: string) => number | null
  hasPendingRating: (videoId: string, tagId: string) => boolean
  flushPendingRatings: () => Promise<void>
  addRatingSavedCallback: (videoId: string, callback: () => void) => void
  removeRatingSavedCallback: (videoId: string) => void
}

const RatingCacheContext = createContext<RatingCacheContextType | undefined>(undefined)

const DEBOUNCE_DELAY = 3000 // 3 seconds
const MAX_CACHE_AGE = 30000 // 30 seconds max age before forced flush
const STORAGE_KEY = 'ratemy_pending_ratings'

export function RatingCacheProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [pendingRatings, setPendingRatings] = useState<Map<string, PendingRating>>(new Map())
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [ratingSavedCallbacks, setRatingSavedCallbacks] = useState<Map<string, () => void>>(new Map())

  // Generate cache key for a rating
  const getCacheKey = (videoId: string, tagId: string) => `${videoId}:${tagId}`

  // Load pending ratings from localStorage
  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return new Map()
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return new Map()
      
      const parsed = JSON.parse(stored) as Array<[string, PendingRating]>
      const ratingsMap = new Map(parsed)
      
      // Filter out old ratings
      const now = Date.now()
      const filteredMap = new Map()
      for (const [key, rating] of ratingsMap) {
        if (now - rating.timestamp <= MAX_CACHE_AGE) {
          filteredMap.set(key, rating)
        }
      }
      
      return filteredMap
    } catch (error) {
      console.warn('Failed to load pending ratings from storage:', error)
      return new Map()
    }
  }, [])

  // Save pending ratings to localStorage
  const saveToStorage = useCallback((ratings: Map<string, PendingRating>) => {
    if (typeof window === 'undefined') return
    
    try {
      const ratingsArray = Array.from(ratings.entries())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratingsArray))
    } catch (error) {
      console.warn('Failed to save pending ratings to storage:', error)
    }
  }, [])

  // Clear storage
  const clearStorage = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear pending ratings from storage:', error)
    }
  }, [])

  // Set a cached rating (will be saved to DB after debounce delay)
  const setCachedRating = useCallback((videoId: string, tagId: string, rating: number) => {
    if (!session) return

    const key = getCacheKey(videoId, tagId)
    const pendingRating: PendingRating = {
      videoId,
      tagId, 
      rating,
      timestamp: Date.now()
    }

    setPendingRatings(prev => {
      const newMap = new Map(prev)
      newMap.set(key, pendingRating)
      
      // Save to localStorage immediately
      saveToStorage(newMap)
      
      return newMap
    })

    // Reset debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const newTimer = setTimeout(() => {
      flushPendingRatings()
    }, DEBOUNCE_DELAY)
    
    setDebounceTimer(newTimer)
  }, [session, debounceTimer, saveToStorage])

  // Get cached rating value
  const getCachedRating = useCallback((videoId: string, tagId: string): number | null => {
    const key = getCacheKey(videoId, tagId)
    const pending = pendingRatings.get(key)
    return pending ? pending.rating : null
  }, [pendingRatings])

  // Check if there's a pending rating
  const hasPendingRating = useCallback((videoId: string, tagId: string): boolean => {
    const key = getCacheKey(videoId, tagId)
    return pendingRatings.has(key)
  }, [pendingRatings])

  // Flush all pending ratings to database
  const flushPendingRatings = useCallback(async () => {
    if (pendingRatings.size === 0 || !session) return

    const ratingsToSave = Array.from(pendingRatings.values())
    
    try {
      // Group ratings by video for efficient API calls
      const ratingsByVideo = new Map<string, PendingRating[]>()
      ratingsToSave.forEach(rating => {
        if (!ratingsByVideo.has(rating.videoId)) {
          ratingsByVideo.set(rating.videoId, [])
        }
        ratingsByVideo.get(rating.videoId)!.push(rating)
      })

      // Save ratings for each video
      const savePromises = Array.from(ratingsByVideo.entries()).map(async ([videoId, ratings]) => {
        for (const rating of ratings) {
          const response = await fetch(`/api/videos/${videoId}/rate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
              tagId: rating.tagId, 
              level: Math.max(1, Math.round(rating.rating)) // Ensure integer between 1-5
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to save rating for video ${videoId}`)
          }
        }
      })

      await Promise.all(savePromises)

      // Notify components that ratings were saved before clearing the cache
      ratingsToSave.forEach(rating => {
        const callback = ratingSavedCallbacks.get(rating.videoId)
        if (callback) {
          callback()
        }
      })

      // Clear pending ratings after successful save
      setPendingRatings(new Map())
      
      // Clear storage
      clearStorage()
      
      // Clear debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        setDebounceTimer(null)
      }

      console.log(`Saved ${ratingsToSave.length} ratings to database`)
      
    } catch (error) {
      console.error('Error flushing pending ratings:', error)
      toast.error('Some ratings could not be saved. Please try again.')
    }
  }, [pendingRatings, session, debounceTimer, clearStorage])

  // Initialize from localStorage on mount
  useEffect(() => {
    if (!isInitialized && session) {
      const storedRatings = loadFromStorage()
      if (storedRatings.size > 0) {
        setPendingRatings(storedRatings)
        
        // Disable immediate flush to prevent unwanted API calls on load
        // setTimeout(async () => {
        //   try {
        //     await flushPendingRatings()
        //     console.log('Successfully flushed pending ratings from localStorage')
        //   } catch (error) {
        //     console.error('Failed to flush ratings on load:', error)
        //   }
        // }, 100) // Very short delay just to ensure component is mounted
      }
      setIsInitialized(true)
    }
  }, [session, isInitialized, loadFromStorage, flushPendingRatings])

  // Auto-flush old cached ratings - DISABLED to prevent periodic calls
  useEffect(() => {
    // Commenting out periodic flush to stop unwanted API calls
    // if (!isInitialized) return
    // 
    // const interval = setInterval(() => {
    //   const now = Date.now()
    //   let hasOldRatings = false
    //
    //   for (const rating of pendingRatings.values()) {
    //     if (now - rating.timestamp > MAX_CACHE_AGE) {
    //       hasOldRatings = true
    //       break
    //     }
    //   }
    //
    //   if (hasOldRatings) {
    //     flushPendingRatings()
    //   }
    // }, 10000) // Check every 10 seconds
    //
    // return () => clearInterval(interval)
  }, [pendingRatings, flushPendingRatings, isInitialized])

  // Flush on page unload/beforeunload
  useEffect(() => {
    if (!isInitialized) return
    
    const handleBeforeUnload = () => {
      if (pendingRatings.size > 0) {
        // Use sendBeacon for reliable data transmission during page unload
        const ratingsData = Array.from(pendingRatings.values())
        navigator.sendBeacon('/api/ratings/flush', JSON.stringify(ratingsData))
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingRatings.size > 0) {
        flushPendingRatings()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pendingRatings, flushPendingRatings, isInitialized])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  // Add callback for a specific video
  const addRatingSavedCallback = useCallback((videoId: string, callback: () => void) => {
    setRatingSavedCallbacks(prev => new Map(prev).set(videoId, callback))
  }, [])

  // Remove callback for a specific video
  const removeRatingSavedCallback = useCallback((videoId: string) => {
    setRatingSavedCallbacks(prev => {
      const newMap = new Map(prev)
      newMap.delete(videoId)
      return newMap
    })
  }, [])

  const value: RatingCacheContextType = {
    pendingRatings,
    setCachedRating,
    getCachedRating,
    hasPendingRating,
    flushPendingRatings,
    addRatingSavedCallback,
    removeRatingSavedCallback
  }

  return (
    <RatingCacheContext.Provider value={value}>
      {children}
    </RatingCacheContext.Provider>
  )
}

export function useRatingCache() {
  const context = useContext(RatingCacheContext)
  if (context === undefined) {
    throw new Error('useRatingCache must be used within a RatingCacheProvider')
  }
  return context
}