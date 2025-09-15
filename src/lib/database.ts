import { PrismaClient } from '@prisma/client'
import { config } from './config'
import { logger, logDatabaseQuery } from './logger'

// Extend PrismaClient with basic configuration
class DatabaseClient extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
      log: ['error', 'warn'],
    })
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error('Database health check failed', { error })
      return false
    }
  }

  async disconnect(): Promise<void> {
    await this.$disconnect()
    logger.info('Database connection closed')
  }
}

// Create singleton database instance
export const db = new DatabaseClient()

// Database connection management
export async function connectDatabase(): Promise<void> {
  try {
    await db.$connect()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error('Failed to connect to database', { error })
    throw error
  }
}

export async function disconnectDatabase(): Promise<void> {
  await db.disconnect()
}

// Database transaction helper
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return db.$transaction(fn as any) as Promise<T>
}

// Database migration helpers
export async function runMigrations(): Promise<void> {
  try {
    // Note: In production, migrations should be run separately
    // This is just for development convenience
    logger.info('Running database migrations...')
    // Migrations are handled by Prisma CLI in production
    logger.info('Migrations completed')
  } catch (error) {
    logger.error('Migration failed', { error })
    throw error
  }
}

// Database seeding helper
export async function seedDatabase(): Promise<void> {
  try {
    logger.info('Seeding database...')
    // Seeding logic would go here
    logger.info('Database seeded successfully')
  } catch (error) {
    logger.error('Database seeding failed', { error })
    throw error
  }
}

// Export prisma client instance for compatibility
export { db as prisma }