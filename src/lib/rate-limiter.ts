import { logger } from './logger'
import { config } from './config'

/**
 * Production-grade rate limiting system
 * Supports both in-memory and Redis backends
 */

export interface RateLimitConfig {
  windowMs: number        // Time window in milliseconds
  maxRequests: number     // Maximum requests per window
  keyPrefix?: string      // Prefix for rate limit keys
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  headers?: boolean       // Include rate limit headers in response
}

export interface RateLimitResult {
  allowed: boolean
  totalRequests: number
  remainingRequests: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>
  set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void>
  increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }>
  cleanup?(): Promise<void>
}

/**
 * In-memory rate limit store
 * Should only be used for development or single-instance deployments
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key)
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry || null
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    this.store.set(key, value)
    // Set cleanup timeout
    setTimeout(() => {
      this.store.delete(key)
    }, ttl)
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const resetTime = now + ttl
    const entry = await this.get(key)

    if (!entry) {
      const newEntry = { count: 1, resetTime }
      await this.set(key, newEntry, ttl)
      return newEntry
    }

    const updatedEntry = { count: entry.count + 1, resetTime: entry.resetTime }
    await this.set(key, updatedEntry, entry.resetTime - now)
    return updatedEntry
  }

  async cleanup(): Promise<void> {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

/**
 * Redis rate limit store for production use
 */
export class RedisRateLimitStore implements RateLimitStore {
  private client: any // Redis client type depends on the Redis library used

  constructor(client: any) {
    this.client = client
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    try {
      const result = await this.client.hgetall(key)
      if (!result || !result.count) return null

      const count = parseInt(result.count, 10)
      const resetTime = parseInt(result.resetTime, 10)

      if (resetTime < Date.now()) {
        await this.client.del(key)
        return null
      }

      return { count, resetTime }
    } catch (error) {
      logger.error('Redis rate limit get error', { error, key })
      return null
    }
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    try {
      const pipeline = this.client.pipeline()
      pipeline.hset(key, 'count', value.count, 'resetTime', value.resetTime)
      pipeline.pexpire(key, ttl)
      await pipeline.exec()
    } catch (error) {
      logger.error('Redis rate limit set error', { error, key })
    }
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    try {
      const now = Date.now()
      const resetTime = now + ttl

      // Use Lua script for atomic increment
      const luaScript = `
        local key = KEYS[1]
        local ttl = tonumber(ARGV[1])
        local resetTime = tonumber(ARGV[2])
        
        local current = redis.call('HGETALL', key)
        
        if #current == 0 then
          redis.call('HSET', key, 'count', 1, 'resetTime', resetTime)
          redis.call('PEXPIRE', key, ttl)
          return {1, resetTime}
        else
          local count = tonumber(current[2]) + 1
          local existingResetTime = tonumber(current[4])
          redis.call('HSET', key, 'count', count)
          return {count, existingResetTime}
        end
      `

      const result = await this.client.eval(luaScript, 1, key, ttl, resetTime)
      return { count: result[0], resetTime: result[1] }
    } catch (error) {
      logger.error('Redis rate limit increment error', { error, key })
      // Fallback to get/set pattern
      const existing = await this.get(key)
      if (!existing) {
        const newEntry = { count: 1, resetTime: Date.now() + ttl }
        await this.set(key, newEntry, ttl)
        return newEntry
      } else {
        const updatedEntry = { count: existing.count + 1, resetTime: existing.resetTime }
        await this.set(key, updatedEntry, existing.resetTime - Date.now())
        return updatedEntry
      }
    }
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private store: RateLimitStore
  private config: Required<RateLimitConfig>

  constructor(store: RateLimitStore, config: RateLimitConfig) {
    this.store = store
    this.config = {
      keyPrefix: 'rate_limit',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      headers: true,
      ...config
    }
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`
    
    try {
      const entry = await this.store.increment(key, this.config.windowMs)
      
      const allowed = entry.count <= this.config.maxRequests
      const remainingRequests = Math.max(0, this.config.maxRequests - entry.count)
      const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - Date.now()) / 1000)

      const result: RateLimitResult = {
        allowed,
        totalRequests: entry.count,
        remainingRequests,
        resetTime: entry.resetTime,
        retryAfter
      }

      if (!allowed) {
        logger.warn('Rate limit exceeded', {
          identifier,
          totalRequests: entry.count,
          maxRequests: this.config.maxRequests,
          resetTime: new Date(entry.resetTime).toISOString()
        })
      }

      return result
    } catch (error) {
      logger.error('Rate limit check failed', { error, identifier })
      // In case of error, allow the request to proceed
      return {
        allowed: true,
        totalRequests: 0,
        remainingRequests: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      }
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`
    try {
      if ('del' in this.store) {
        await (this.store as any).del(key)
      } else {
        // For memory store, we can implement a manual deletion
        if (this.store instanceof MemoryRateLimitStore) {
          (this.store as any).store.delete(key)
        }
      }
      logger.info('Rate limit reset', { identifier })
    } catch (error) {
      logger.error('Rate limit reset failed', { error, identifier })
    }
  }
}

/**
 * Create rate limiter with appropriate store based on configuration
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  let store: RateLimitStore

  if (process.env.NODE_ENV === 'production' && global.redisClient) {
    store = new RedisRateLimitStore(global.redisClient)
    logger.info('Using Redis rate limit store')
  } else {
    store = new MemoryRateLimitStore()
    logger.info('Using memory rate limit store')
  }

  return new RateLimiter(store, config)
}

/**
 * Default rate limiters for different use cases
 */
export const rateLimiters = {
  // General API rate limiting
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyPrefix: 'api_limit'
  }),

  // Authentication rate limiting (stricter)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    keyPrefix: 'auth_limit'
  }),

  // Upload rate limiting
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyPrefix: 'upload_limit'
  }),

  // Strict rate limiting for sensitive operations
  strict: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    keyPrefix: 'strict_limit'
  })
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const headers = {
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
    'x-client-ip': request.headers.get('x-client-ip')
  }

  // Use first non-null IP
  for (const [header, value] of Object.entries(headers)) {
    if (value) {
      const ip = value.split(',')[0].trim()
      if (ip) return ip
    }
  }

  // Fallback to a default identifier
  return 'unknown'
}

/**
 * Rate limiting headers utility
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.totalRequests.toString(),
    'X-RateLimit-Remaining': result.remainingRequests.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
  }
}