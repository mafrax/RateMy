import { db } from '../lib/db'
import { logger } from '../lib/logger'
import { Repository } from '../types'

export abstract class BaseRepository<T> implements Repository<T> {
  protected abstract tableName: string

  async findById(id: string): Promise<T | null> {
    try {
      const result = await (db as any)[this.tableName].findUnique({
        where: { id }
      })
      return result
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by id`, { id, error })
      throw error
    }
  }

  async findMany(filters?: any): Promise<T[]> {
    try {
      const result = await (db as any)[this.tableName].findMany(filters)
      return result
    } catch (error) {
      logger.error(`Error finding many ${this.tableName}`, { filters, error })
      throw error
    }
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const result = await (db as any)[this.tableName].create({
        data
      })
      logger.info(`Created ${this.tableName}`, { id: result.id })
      return result
    } catch (error) {
      logger.error(`Error creating ${this.tableName}`, { data, error })
      throw error
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const result = await (db as any)[this.tableName].update({
        where: { id },
        data
      })
      logger.info(`Updated ${this.tableName}`, { id })
      return result
    } catch (error) {
      logger.error(`Error updating ${this.tableName}`, { id, data, error })
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await (db as any)[this.tableName].delete({
        where: { id }
      })
      logger.info(`Deleted ${this.tableName}`, { id })
    } catch (error) {
      logger.error(`Error deleting ${this.tableName}`, { id, error })
      throw error
    }
  }

  async count(filters?: any): Promise<number> {
    try {
      const result = await (db as any)[this.tableName].count(filters)
      return result
    } catch (error) {
      logger.error(`Error counting ${this.tableName}`, { filters, error })
      throw error
    }
  }

  protected async findManyWithPagination(
    filters: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: T[]; total: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit
      const [items, total] = await Promise.all([
        (db as any)[this.tableName].findMany({
          ...filters,
          skip,
          take: limit,
        }),
        (db as any)[this.tableName].count({
          where: filters.where,
        }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        items,
        total,
        totalPages,
      }
    } catch (error) {
      logger.error(`Error finding ${this.tableName} with pagination`, {
        filters,
        page,
        limit,
        error,
      })
      throw error
    }
  }
}