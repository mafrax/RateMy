import { NODE_ENV } from './constants'

interface Config {
  app: {
    name: string
    version: string
    env: string
    port: number
    url: string
  }
  database: {
    url: string
  }
  auth: {
    secret: string
    url: string
    sessionMaxAge: number
  }
  logging: {
    level: string
    pretty: boolean
  }
  redis?: {
    url: string
    password?: string
  }
  external: {
    youtube?: {
      apiKey: string
    }
    vimeo?: {
      clientId: string
      clientSecret: string
    }
  }
}

function getConfig(): Config {
  const env = process.env.NODE_ENV || NODE_ENV.DEVELOPMENT
  const isDevelopment = env === NODE_ENV.DEVELOPMENT
  const isProduction = env === NODE_ENV.PRODUCTION

  // Validate required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`)
    }
  }

  return {
    app: {
      name: process.env.APP_NAME || 'RateMe',
      version: process.env.APP_VERSION || '1.0.0',
      env,
      port: parseInt(process.env.PORT || '3000', 10),
      url: process.env.NEXTAUTH_URL!,
    },
    database: {
      url: process.env.DATABASE_URL!,
    },
    auth: {
      secret: process.env.NEXTAUTH_SECRET!,
      url: process.env.NEXTAUTH_URL!,
      sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000', 10), // 30 days
    },
    logging: {
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      pretty: isDevelopment,
    },
    redis: process.env.REDIS_URL ? {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
    } : undefined,
    external: {
      youtube: process.env.YOUTUBE_API_KEY ? {
        apiKey: process.env.YOUTUBE_API_KEY,
      } : undefined,
      vimeo: process.env.VIMEO_CLIENT_ID && process.env.VIMEO_CLIENT_SECRET ? {
        clientId: process.env.VIMEO_CLIENT_ID,
        clientSecret: process.env.VIMEO_CLIENT_SECRET,
      } : undefined,
    },
  }
}

// Export singleton config instance
export const config = getConfig()

// Type-safe environment variable access
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name]
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value
}

export function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name]
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`Environment variable ${name} is not set`)
  }
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} is not a valid number: ${value}`)
  }
  return parsed
}

export function getEnvVarAsBoolean(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name]
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value.toLowerCase() === 'true'
}

// Environment checks
export const isDevelopment = config.app.env === NODE_ENV.DEVELOPMENT
export const isProduction = config.app.env === NODE_ENV.PRODUCTION
export const isTest = config.app.env === NODE_ENV.TEST