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
  setDebounceDelay: (delay: number) => void
  getDebounceDelay: () => number
  getCacheStats: () => { pendingCount: number; oldestTimestamp: number | null }
}

const RatingCacheContext = createContext<RatingCacheContextType | undefined>(undefined)

const DEFAULT_DEBOUNCE_DELAY = 3000 // 3 seconds
const MAX_CACHE_AGE = 30000 // 30 seconds max age before forced flush
const STORAGE_KEY = 'ratemy_pending_ratings'
const DEBOUNCE_DELAY_KEY = 'ratemy_debounce_delay'

export function RatingCacheProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [pendingRatings, setPendingRatings] = useState<Map<string, PendingRating>>(new Map())
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [debounceDelay, setDebounceDelayState] = useState<number>(DEFAULT_DEBOUNCE_DELAY)
  const [isInitialized, setIsInitialized] = useState(false)

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
      ratingsMap.forEach((rating, key) => {
        if (now - rating.timestamp <= MAX_CACHE_AGE) {
          filteredMap.set(key, rating)
        }
      })
      
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
    }, debounceDelay)
    
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

  // Flush all pending ratings to database using bulk API
  const flushPendingRatings = useCallback(async () => {
    if (pendingRatings.size === 0 || !session) return

    const ratingsToSave = Array.from(pendingRatings.values())
    
    try {
      // Use bulk flush API for better performance
      const response = await fetch('/api/ratings/flush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(ratingsToSave.map(rating => ({
          videoId: rating.videoId,
          tagId: rating.tagId,
          rating: rating.rating,
          timestamp: rating.timestamp
        }))),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to flush ratings`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to save ratings')
      }

      // Notify components that ratings were saved before clearing the cache
      // Note: Removed automatic callback execution to prevent unwanted page refreshes
      // Components can manually check for rating updates or use server-side caching instead

      const { successful, failed, results, errors } = result.data
      
      // Only clear successfully saved ratings from cache
      const successfulKeys = new Set<string>()
      const failedKeys = new Set<string>()
      
      // Process successful results
      if (results && Array.isArray(results)) {
        results.forEach((result: any) => {
          const key = getCacheKey(result.videoId, result.tagId)
          successfulKeys.add(key)
        })
      }
      
      // Process failed results  
      if (errors && Array.isArray(errors)) {
        errors.forEach((error: any) => {
          const key = getCacheKey(error.videoId, error.tagId)
          failedKeys.add(key)
        })
      }
      
      // Update pending ratings - keep only failed ones
      const newPendingRatings = new Map<string, PendingRating>()
      
      pendingRatings.forEach((rating, key) => {
        if (failedKeys.has(key)) {
          // Keep ratings that failed to save
          newPendingRatings.set(key, rating)
        }
        // Successful ratings are automatically removed by not being added to newPendingRatings
      })
      
      setPendingRatings(newPendingRatings)
      
      // Update localStorage storage
      if (newPendingRatings.size === 0) {
        clearStorage()
      } else {
        saveToStorage(newPendingRatings)
      }
      
      // Clear debounce timer only if all ratings were processed
      if (failed === 0 && debounceTimer) {
        clearTimeout(debounceTimer)
        setDebounceTimer(null)
      }

      // Log success with detailed info
      console.log(`Bulk rating flush completed: ${successful} successful, ${failed} failed out of ${ratingsToSave.length} total`)
      
      if (failed > 0) {
        console.warn('Some ratings failed to save:', errors)
        toast.error(`${failed} ratings could not be saved. They will be retried automatically.`)
      }
      
    } catch (error) {
      console.error('Error flushing pending ratings:', error)
      toast.error('Some ratings could not be saved. Please try again.')
      
      // Don't clear cache on error - allow retry
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

  // Removed rating saved callback functions to prevent unwanted page refreshes

  // Set custom debounce delay
  const setDebounceDelay = useCallback((delay: number) => {
    const validatedDelay = Math.max(1000, Math.min(30000, delay)) // Between 1-30 seconds
    setDebounceDelayState(validatedDelay)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DEBOUNCE_DELAY_KEY, validatedDelay.toString())
      } catch (error) {
        console.warn('Failed to save debounce delay to storage:', error)
      }
    }
  }, [])

  // Get current debounce delay
  const getDebounceDelay = useCallback(() => debounceDelay, [debounceDelay])

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const ratings = Array.from(pendingRatings.values())
    const oldestTimestamp = ratings.length > 0 
      ? Math.min(...ratings.map(r => r.timestamp))
      : null
    
    return {
      pendingCount: pendingRatings.size,
      oldestTimestamp
    }
  }, [pendingRatings])

  // Load debounce delay from storage on initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedDelay = localStorage.getItem(DEBOUNCE_DELAY_KEY)
        if (storedDelay) {
          const delay = parseInt(storedDelay, 10)
          if (!isNaN(delay) && delay >= 1000 && delay <= 30000) {
            setDebounceDelayState(delay)
          }
        }
      } catch (error) {
        console.warn('Failed to load debounce delay from storage:', error)
      }
    }
  }, [])

  const value: RatingCacheContextType = {
    pendingRatings,
    setCachedRating,
    getCachedRating,
    hasPendingRating,
    flushPendingRatings,
    setDebounceDelay,
    getDebounceDelay,
    getCacheStats
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