'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
  
  // Use a ref to avoid stale closure issues with the timer
  const flushPendingRatingsRef = useRef<(() => Promise<void>) | null>(null)

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

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    console.log(`⭐ [${timestamp}] SETTING CACHED RATING: ${videoId}:${tagId} = ${rating}`)
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
      console.log(`⏰ Clearing existing timer for new rating: ${videoId}:${tagId}`)
      clearTimeout(debounceTimer)
    }

    const newTimer = setTimeout(() => {
      console.log(`⏰ Timer expired, flushing all pending ratings`)
      // Use ref to avoid stale closure
      if (flushPendingRatingsRef.current) {
        flushPendingRatingsRef.current()
      }
    }, debounceDelay)
    
    console.log(`⏰ Set new timer for ${debounceDelay}ms`)
    setDebounceTimer(newTimer)
  }, [session, debounceTimer, saveToStorage, debounceDelay])

  // Get cached rating value
  const getCachedRating = useCallback((videoId: string, tagId: string): number | null => {
    const key = getCacheKey(videoId, tagId)
    const pending = pendingRatings.get(key)
    
    if (pending) {
      // Validate that the cached rating matches the requested video/tag
      if (pending.videoId !== videoId || pending.tagId !== tagId) {
        console.error(`🚨 CACHED RATING MISMATCH: requested ${videoId}:${tagId}, got ${pending.videoId}:${pending.tagId}, removing corrupt cache entry`)
        // Remove the corrupt cache entry
        const corruptedKey = key
        setPendingRatings(prev => {
          const cleaned = new Map(prev)
          cleaned.delete(corruptedKey)
          return cleaned
        })
        return null
      }
      console.log(`📊 [${new Date().toISOString().split('T')[1].split('.')[0]}] Cache hit: ${videoId}:${tagId} = ${pending.rating}`)
      return pending.rating
    }
    
    return null
  }, [pendingRatings, setPendingRatings])

  // Check if there's a pending rating
  const hasPendingRating = useCallback((videoId: string, tagId: string): boolean => {
    const key = getCacheKey(videoId, tagId)
    const rating = pendingRatings.get(key)
    if (!rating) return false
    
    // Validate that the cached rating matches the requested video/tag
    if (rating.videoId !== videoId || rating.tagId !== tagId) {
      console.error(`🚨 PENDING RATING MISMATCH: requested ${videoId}:${tagId}, got ${rating.videoId}:${rating.tagId}`)
      return false
    }
    
    // Check if this is an expired "saved" rating
    const now = Date.now()
    if (rating.timestamp > now && rating.timestamp - now < 6000) {
      // This is a saved rating that's temporarily kept to prevent visual revert
      // Don't show it as pending since it's already saved
      return false
    }
    
    return true
  }, [pendingRatings])

  // Flush all pending ratings to database using bulk API
  const flushPendingRatings = useCallback(async () => {
    if (pendingRatings.size === 0 || !session) return

    // Only flush actual pending ratings, not temporarily saved ones
    const now = Date.now()
    const actualPendingRatings = Array.from(pendingRatings.values()).filter(rating => 
      rating.timestamp <= now // Normal pending ratings have past timestamps
    )
    
    console.log(`🔍 FLUSH ANALYSIS: Total cache entries=${pendingRatings.size}, Actual pending=${actualPendingRatings.length}`)
    actualPendingRatings.forEach(rating => {
      console.log(`   → ${rating.videoId}:${rating.tagId} = ${rating.rating} (age: ${(now - rating.timestamp)/1000}s)`)
    })
    
    if (actualPendingRatings.length === 0) {
      console.log('🚀 No actual pending ratings to flush (only saved ones)')
      return
    }

    console.log('🚀 FLUSHING RATINGS:', actualPendingRatings.length, 'actual pending ratings out of', pendingRatings.size, 'total')
    const ratingsToSave = actualPendingRatings
    
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
      
      // Add detailed API response logging
      console.log('📡 FULL API RESPONSE:', JSON.stringify(result, null, 2))
      console.log('📊 API Response Summary:', {
        success: result.success,
        processed: result.data?.processed,
        successful: result.data?.successful,
        failed: result.data?.failed,
        hasErrors: !!(result.data?.errors && result.data.errors.length > 0),
        errorCount: result.data?.errors?.length || 0,
        message: result.message,
        error: result.error
      })
      
      if (!result.success) {
        console.error('❌ API ERROR DETAILS:', result)
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
        console.log('✅ Successfully saved ratings:', results.length)
        results.forEach((result: any) => {
          const key = getCacheKey(result.videoId, result.tagId)
          console.log(`✅ Success: ${result.videoId}:${result.tagId} (key: ${key})`)
          successfulKeys.add(key)
        })
      }
      
      // Process failed results  
      if (errors && Array.isArray(errors)) {
        console.log('❌ Failed to save ratings:', errors.length)
        errors.forEach((error: any) => {
          const key = getCacheKey(error.videoId, error.tagId)
          console.log(`❌ Failed: ${error.videoId}:${error.tagId} - ${error.error}`)
          failedKeys.add(key)
        })
      }
      
      // Update pending ratings - keep successful ones as "saved" for a short time
      // to prevent visual reversion until components get fresh data
      const newPendingRatings = new Map<string, PendingRating>()
      
      console.log('🧹 Clearing cache: before =', pendingRatings.size, 'successful =', successfulKeys.size, 'failed =', failedKeys.size)
      
      pendingRatings.forEach((rating, key) => {
        const expectedKey = getCacheKey(rating.videoId, rating.tagId)
        if (key !== expectedKey) {
          console.error(`🚨 CACHE KEY MISMATCH: stored key=${key}, expected=${expectedKey}`)
        }
        
        // Check if this specific rating was in the batch that was flushed
        const wasInFlushBatch = ratingsToSave.some(flushedRating => 
          flushedRating.videoId === rating.videoId && flushedRating.tagId === rating.tagId
        )
        
        if (failedKeys.has(key)) {
          // Keep ratings that failed to save - they need to be retried
          console.log(`🔄 Keeping failed rating in cache: ${rating.videoId}:${rating.tagId}`)
          newPendingRatings.set(key, rating)
        } else if (successfulKeys.has(key) && wasInFlushBatch) {
          // Only mark as temporarily saved if it was actually in the flush batch
          console.log(`✅ Keeping successful rating temporarily: ${rating.videoId}:${rating.tagId}`)
          newPendingRatings.set(key, {
            ...rating,
            timestamp: Date.now() + 5000 // Mark as saved, will auto-expire in 5 seconds (longer to handle component re-renders)
          })
        } else if (!wasInFlushBatch) {
          // This rating wasn't in the flush batch, so keep it as-is
          console.log(`🔄 Keeping unflushed rating: ${rating.videoId}:${rating.tagId}`)
          newPendingRatings.set(key, rating)
        } else {
          console.log(`⚠️ Rating not in success or fail list: ${rating.videoId}:${rating.tagId} (key: ${key})`)
          // Keep unknown ratings to be safe
          newPendingRatings.set(key, rating)
        }
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

  // Assign the function to the ref to avoid stale closure issues
  useEffect(() => {
    flushPendingRatingsRef.current = flushPendingRatings
  }, [flushPendingRatings])

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

  // Clean up expired "saved" ratings periodically
  useEffect(() => {
    if (!isInitialized) return
    
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      let hasExpiredRatings = false
      
      // Check for expired "saved" ratings (those with future timestamps that have passed)
      for (const rating of Array.from(pendingRatings.values())) {
        if (rating.timestamp > now - 8000 && rating.timestamp <= now + 6000) {
          // This might be a saved rating that should be cleaned up
          hasExpiredRatings = true
          break
        }
      }
      
      if (hasExpiredRatings) {
        setPendingRatings(prev => {
          const cleaned = new Map<string, PendingRating>()
          const currentTime = Date.now()
          
          prev.forEach((rating, key) => {
            // Keep ratings that are either:
            // 1. Normal pending ratings (timestamp in the past)
            // 2. Saved ratings that haven't expired yet (timestamp > now + buffer)
            if (rating.timestamp <= currentTime || rating.timestamp > currentTime + 6000) {
              cleaned.set(key, rating)
            } else {
              console.log(`🧹 Cleaning up expired saved rating: ${rating.videoId}:${rating.tagId}`)
            }
          })
          
          // Update localStorage if anything changed
          if (cleaned.size !== prev.size) {
            if (cleaned.size === 0) {
              clearStorage()
            } else {
              saveToStorage(cleaned)
            }
          }
          
          return cleaned.size !== prev.size ? cleaned : prev
        })
      }
    }, 1000) // Check every second for cleanup
    
    return () => clearInterval(cleanupInterval)
  }, [pendingRatings, isInitialized, clearStorage, saveToStorage])

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