// Application constants
export const APP_NAME = 'RateMe'
export const APP_DESCRIPTION = 'A modern video rating platform'
export const APP_VERSION = '1.0.0'

// API constants
export const API_ROUTES = {
  AUTH: {
    SIGNIN: '/api/auth/signin',
    SIGNUP: '/api/auth/register',
    SIGNOUT: '/api/auth/signout',
  },
  VIDEOS: {
    BASE: '/api/videos',
    BY_ID: (id: string) => `/api/videos/${id}`,
    RATE: (id: string) => `/api/videos/${id}/rate`,
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    FOLLOW: (id: string) => `/api/users/${id}/follow`,
  },
} as const

// UI constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
} as const

export const VIDEO_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  // Removed MAX_TAGS limit to allow unlimited tags
} as const

export const USER_LIMITS = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
} as const

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  YOUTUBE_URL: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  VIMEO_URL: /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
} as const

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_FORBIDDEN: 'RESOURCE_FORBIDDEN',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const

// Cache keys
export const CACHE_KEYS = {
  VIDEOS: 'videos',
  USER: (id: string) => `user:${id}`,
  VIDEO: (id: string) => `video:${id}`,
  TAGS: 'tags',
  USER_VIDEOS: (userId: string) => `user:${userId}:videos`,
} as const

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const

// Environment types
export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// Supported video platforms
export const VIDEO_PLATFORMS = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
} as const

// Rating levels
export const RATING_LEVELS = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 3,
} as const

// Default values
export const DEFAULTS = {
  AVATAR_URL: '/images/default-avatar.png',
  VIDEO_THUMBNAIL: '/images/default-video-thumbnail.png',
  PAGINATION_LIMIT: PAGINATION.DEFAULT_PAGE_SIZE,
  RATING_LEVEL: RATING_LEVELS.DEFAULT,
} as const

// Feature flags
export const FEATURES = {
  VIDEO_UPLOAD: true,
  USER_REGISTRATION: true,
  VIDEO_RATING: true,
  USER_FOLLOWING: true,
  SEARCH: true,
  ADMIN_PANEL: false,
} as const

// External service URLs
export const EXTERNAL_SERVICES = {
  YOUTUBE_API: 'https://www.googleapis.com/youtube/v3',
  VIMEO_API: 'https://api.vimeo.com',
} as const

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
} as const

// SEO constants
export const SEO = {
  DEFAULT_TITLE: APP_NAME,
  TITLE_TEMPLATE: `%s | ${APP_NAME}`,
  DEFAULT_DESCRIPTION: APP_DESCRIPTION,
  TWITTER_HANDLE: '@rateme',
  SITE_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
} as const

// Social sharing
export const SOCIAL_PLATFORMS = {
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  REDDIT: 'reddit',
} as const