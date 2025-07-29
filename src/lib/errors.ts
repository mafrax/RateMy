import { ERROR_CODES, HTTP_STATUS } from './constants'

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: any

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: any) {
    super(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      true,
      { field, ...context }
    )
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(
      message,
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED,
      true,
      context
    )
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access forbidden', context?: any) {
    super(
      message,
      ERROR_CODES.RESOURCE_FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
      true,
      context
    )
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: any) {
    super(
      `${resource} not found`,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      true,
      context
    )
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: any) {
    super(
      message,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      HTTP_STATUS.CONFLICT,
      true,
      context
    )
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: any) {
    super(
      message,
      ERROR_CODES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      true,
      context
    )
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: any) {
    super(
      `External service error (${service}): ${message}`,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      HTTP_STATUS.BAD_GATEWAY,
      true,
      context
    )
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: any) {
    super(
      message,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      true,
      context
    )
  }
}

// Error factory functions
export function createValidationError(field: string, message: string, value?: any): ValidationError {
  return new ValidationError(message, field, { value })
}

export function createNotFoundError(resource: string, id?: string): NotFoundError {
  return new NotFoundError(resource, { id })
}

export function createConflictError(resource: string, field: string, value: any): ConflictError {
  return new ConflictError(
    `${resource} with ${field} '${value}' already exists`,
    { resource, field, value }
  )
}

// Error handling utilities
export function isAppError(error: any): error is AppError {
  return error instanceof AppError
}

export function isOperationalError(error: any): boolean {
  if (isAppError(error)) {
    return error.isOperational
  }
  return false
}

export function extractErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

export function extractErrorCode(error: any): string {
  if (isAppError(error)) {
    return error.code
  }
  return ERROR_CODES.INTERNAL_SERVER_ERROR
}

export function extractStatusCode(error: any): number {
  if (isAppError(error)) {
    return error.statusCode
  }
  return HTTP_STATUS.INTERNAL_SERVER_ERROR
}

// Error serialization
export interface SerializedError {
  message: string
  code: string
  statusCode: number
  context?: any
  stack?: string
}

export function serializeError(error: any, includeStack: boolean = false): SerializedError {
  const serialized: SerializedError = {
    message: extractErrorMessage(error),
    code: extractErrorCode(error),
    statusCode: extractStatusCode(error),
  }

  if (isAppError(error) && error.context) {
    serialized.context = error.context
  }

  if (includeStack && error instanceof Error) {
    serialized.stack = error.stack
  }

  return serialized
}

// Async error wrapper
export function asyncWrapper<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (isOperationalError(error)) {
        throw error
      }
      
      // Convert non-operational errors to operational ones
      throw new AppError(
        extractErrorMessage(error),
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        false,
        { originalError: error }
      )
    }
  }
}

// Promise error handler
export function handlePromiseRejection(promise: Promise<any>): Promise<any> {
  return promise.catch((error) => {
    if (!isOperationalError(error)) {
      // Log unexpected errors
      console.error('Unhandled promise rejection:', error)
    }
    throw error
  })
}