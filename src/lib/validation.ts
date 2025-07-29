import { z } from 'zod'
import { VALIDATION_PATTERNS, USER_LIMITS, VIDEO_LIMITS } from './constants'
import { ValidationError } from './errors'

// Base validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')

export const passwordSchema = z
  .string()
  .min(USER_LIMITS.MIN_PASSWORD_LENGTH, `Password must be at least ${USER_LIMITS.MIN_PASSWORD_LENGTH} characters long`)
  .max(USER_LIMITS.MAX_PASSWORD_LENGTH, `Password must be at most ${USER_LIMITS.MAX_PASSWORD_LENGTH} characters long`)

export const usernameSchema = z
  .string()
  .min(USER_LIMITS.MIN_USERNAME_LENGTH, `Username must be at least ${USER_LIMITS.MIN_USERNAME_LENGTH} characters long`)
  .max(USER_LIMITS.MAX_USERNAME_LENGTH, `Username must be at most ${USER_LIMITS.MAX_USERNAME_LENGTH} characters long`)
  .regex(VALIDATION_PATTERNS.USERNAME, 'Username can only contain letters, numbers, and underscores')

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .min(1, 'URL is required')


// User validation schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const updateUserSchema = z.object({
  firstName: z.string().max(50, 'First name is too long').optional(),
  lastName: z.string().max(50, 'Last name is too long').optional(),
  city: z.string().max(100, 'City name is too long').optional(),
  birthDay: z.date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
}).partial()

// Video validation schemas
export const createVideoSchema = z.object({
  title: z
    .string()
    .max(VIDEO_LIMITS.MAX_TITLE_LENGTH, `Title must be at most ${VIDEO_LIMITS.MAX_TITLE_LENGTH} characters long`)
    .optional(), // Title can be auto-extracted
  originalUrl: urlSchema,
  description: z
    .string()
    .max(VIDEO_LIMITS.MAX_DESCRIPTION_LENGTH, `Description must be at most ${VIDEO_LIMITS.MAX_DESCRIPTION_LENGTH} characters long`)
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(VIDEO_LIMITS.MAX_TAGS, `Maximum ${VIDEO_LIMITS.MAX_TAGS} tags allowed`)
    .optional()
    .default([]),
})

export const updateVideoSchema = createVideoSchema.partial()

// Tag rating filter schema
const tagRatingFilterSchema = z.object({
  tagName: z.string(),
  minRating: z.number().min(1).max(5),
  maxRating: z.number().min(1).max(5),
})

// Schema for validating query parameters (strings from URL)
export const videoFilterQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional().default([]).transform(val => {
    if (!val || val.length === 0) return []
    return Array.isArray(val) ? val : [val]
  }),
  tagRatings: z.string().optional().transform(val => {
    if (!val) return []
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? z.array(tagRatingFilterSchema).parse(parsed) : []
    } catch {
      return []
    }
  }),
  userId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'title', 'ratings']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().optional().default('1').transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('12').transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(50)),
})

// Schema for validating already-typed filter objects (for service layer)
export const videoFilterSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).default([]),
  tagRatings: z.array(tagRatingFilterSchema).default([]),
  userId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'title', 'ratings']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
})

// Rating validation schema
export const ratingSchema = z.object({
  tagId: z.string().cuid('Invalid tag ID'),
  level: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1).default(1)),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(50).default(12)),
})

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query is too long'),
})

// ID validation schemas
export const uuidSchema = z.string().uuid('Invalid ID format')

// Validation utility functions
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new ValidationError(firstError.message, firstError.path.join('.'), {
        field: firstError.path.join('.'),
        value: firstError.code === 'invalid_type' ? data : undefined,
        errors: error.errors,
      })
    }
    throw error
  }
}

export function validatePartialSchema<T>(schema: z.ZodObject<any>, data: unknown): Partial<T> {
  return validateSchema(schema.partial(), data) as Partial<T>
}

export function safeValidateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const validatedData = validateSchema(schema, data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error }
    }
    return {
      success: false,
      error: new ValidationError('Validation failed', undefined, { originalError: error })
    }
  }
}

// Field-specific validators
export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email)
}

export function isValidUsername(username: string): boolean {
  return (
    username.length >= USER_LIMITS.MIN_USERNAME_LENGTH &&
    username.length <= USER_LIMITS.MAX_USERNAME_LENGTH &&
    VALIDATION_PATTERNS.USERNAME.test(username)
  )
}

export function isValidPassword(password: string): boolean {
  return (
    password.length >= USER_LIMITS.MIN_PASSWORD_LENGTH &&
    password.length <= USER_LIMITS.MAX_PASSWORD_LENGTH
  )
}

export function isValidVideoUrl(url: string): boolean {
  try {
    new URL(url) // Check if it's a valid URL
    return true // Accept any valid URL now that we support multiple platforms
  } catch {
    return false
  }
}

// Custom validation helpers
export function validateArrayOfStrings(
  array: unknown,
  fieldName: string,
  maxLength?: number
): string[] {
  if (!Array.isArray(array)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName)
  }

  if (maxLength && array.length > maxLength) {
    throw new ValidationError(
      `${fieldName} cannot have more than ${maxLength} items`,
      fieldName,
      { maxLength, currentLength: array.length }
    )
  }

  return array.map((item, index) => {
    if (typeof item !== 'string') {
      throw new ValidationError(
        `${fieldName}[${index}] must be a string`,
        `${fieldName}[${index}]`,
        { value: item, type: typeof item }
      )
    }
    return item.trim()
  }).filter(item => item.length > 0)
}

export function validateOptionalString(
  value: unknown,
  fieldName: string,
  maxLength?: number
): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, {
      value,
      type: typeof value
    })
  }

  if (maxLength && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} cannot be longer than ${maxLength} characters`,
      fieldName,
      { maxLength, currentLength: value.length }
    )
  }

  return value.trim()
}

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

export function sanitizeArray(input: string[]): string[] {
  return input
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0)
    .filter((item, index, arr) => arr.indexOf(item) === index) // Remove duplicates
}

export function sanitizeTags(tags: string[]): string[] {
  return sanitizeArray(tags)
    .map(tag => tag.toLowerCase())
    .slice(0, VIDEO_LIMITS.MAX_TAGS)
}