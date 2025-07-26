import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { 
  AppError, 
  isAppError, 
  serializeError,
  AuthenticationError 
} from './errors'
import { logger, logApiRequest, logApiError } from './logger'
import { HTTP_STATUS } from './constants'
import { ApiResponse } from '../types'

export interface ApiContext {
  req: NextApiRequest
  res: NextApiResponse
  user?: {
    id: string
    email: string
    username: string
  }
}

export type ApiHandler = (ctx: ApiContext) => Promise<any>

export interface ApiRouteConfig {
  methods?: string[]
  requireAuth?: boolean
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
}

// Main API route wrapper
export function createApiRoute(
  handlers: { [method: string]: ApiHandler },
  config: ApiRouteConfig = {}
) {
  const { 
    methods = Object.keys(handlers), 
    requireAuth = false 
  } = config

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now()
    const { method = 'GET' } = req
    let user

    try {
      // Check if method is allowed
      if (!methods.includes(method)) {
        return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({
          success: false,
          message: `Method ${method} not allowed`,
          error: 'METHOD_NOT_ALLOWED'
        })
      }

      // Get user session if auth is required
      if (requireAuth) {
        const session = await getServerSession(req, res, authOptions)
        if (!session?.user) {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Authentication required',
            error: 'UNAUTHORIZED'
          })
        }
        user = session.user as any
      }

      // Create API context
      const ctx: ApiContext = { req, res, user }

      // Get handler for method
      const handler = handlers[method]
      if (!handler) {
        return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({
          success: false,
          message: `Handler for ${method} not found`,
          error: 'METHOD_NOT_ALLOWED'
        })
      }

      // Execute handler
      const result = await handler(ctx)
      
      // Log successful request
      const duration = Date.now() - startTime
      logApiRequest(method, req.url || '', user?.id, duration)

      // Send response if not already sent
      if (!res.headersSent) {
        res.status(HTTP_STATUS.OK).json(result)
      }

    } catch (error) {
      const duration = Date.now() - startTime
      logApiError(method, req.url || '', error as Error, user?.id)
      
      // Handle known application errors
      if (isAppError(error)) {
        const serializedError = serializeError(error, false)
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.code,
          ...(error.context && { context: error.context })
        })
      }

      // Handle unknown errors
      logger.error('Unhandled API error', { 
        method, 
        url: req.url, 
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id 
      })

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR'
      })
    }
  }
}

// Utility to require authentication
export function requireAuth(handler: ApiHandler): ApiHandler {
  return async (ctx: ApiContext) => {
    if (!ctx.user) {
      throw new AuthenticationError('Authentication required')
    }
    return handler(ctx)
  }
}

// Utility to validate request body
export function validateBody<T>(
  schema: any,
  handler: (ctx: ApiContext, body: T) => Promise<any>
): ApiHandler {
  return async (ctx: ApiContext) => {
    try {
      const validatedBody = schema.parse(ctx.req.body)
      return handler(ctx, validatedBody)
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as any
        const firstError = zodError.errors[0]
        throw new AppError(
          firstError.message,
          'VALIDATION_ERROR',
          HTTP_STATUS.BAD_REQUEST,
          true,
          { field: firstError.path.join('.'), errors: zodError.errors }
        )
      }
      throw error
    }
  }
}

// Utility to validate query parameters
export function validateQuery<T>(
  schema: any,
  handler: (ctx: ApiContext, query: T) => Promise<any>
): ApiHandler {
  return async (ctx: ApiContext) => {
    try {
      const validatedQuery = schema.parse(ctx.req.query)
      return handler(ctx, validatedQuery)
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as any
        const firstError = zodError.errors[0]
        throw new AppError(
          firstError.message,
          'VALIDATION_ERROR',
          HTTP_STATUS.BAD_REQUEST,
          true,
          { field: firstError.path.join('.'), errors: zodError.errors }
        )
      }
      throw error
    }
  }
}

// Utility for pagination
export function withPagination(
  handler: (ctx: ApiContext, pagination: { page: number; limit: number }) => Promise<any>
): ApiHandler {
  return async (ctx: ApiContext) => {
    const page = parseInt(ctx.req.query.page as string) || 1
    const limit = Math.min(parseInt(ctx.req.query.limit as string) || 12, 50) // Max 50 items per page
    
    return handler(ctx, { page, limit })
  }
}

// Response helpers
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message })
  }
}

export function errorResponse(message: string, code?: string): ApiResponse {
  return {
    success: false,
    message,
    ...(code && { error: code })
  }
}

// Method-specific handlers
export const GET = (handler: ApiHandler) => ({ GET: handler })
export const POST = (handler: ApiHandler) => ({ POST: handler })
export const PUT = (handler: ApiHandler) => ({ PUT: handler })
export const DELETE = (handler: ApiHandler) => ({ DELETE: handler })
export const PATCH = (handler: ApiHandler) => ({ PATCH: handler })

// Combined method handlers
export const CRUD = {
  GET: (handler: ApiHandler) => handler,
  POST: (handler: ApiHandler) => handler,
  PUT: (handler: ApiHandler) => handler,
  DELETE: (handler: ApiHandler) => handler,
}

// Rate limiting (simple in-memory implementation for development)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) {
  return (handler: ApiHandler): ApiHandler => {
    return async (ctx: ApiContext) => {
      const key = ctx.req.headers['x-forwarded-for'] as string || 
                   ctx.req.connection.remoteAddress || 
                   'unknown'
      
      const now = Date.now()
      const windowStart = now - windowMs
      
      const requestData = requestCounts.get(key)
      
      if (!requestData || requestData.resetTime < windowStart) {
        requestCounts.set(key, { count: 1, resetTime: now })
        return handler(ctx)
      }
      
      if (requestData.count >= maxRequests) {
        throw new AppError(
          'Too many requests',
          'RATE_LIMIT_EXCEEDED',
          HTTP_STATUS.TOO_MANY_REQUESTS
        )
      }
      
      requestData.count++
      return handler(ctx)
    }
  }
}