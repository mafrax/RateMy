import { Tag } from '../types'
import { BaseRepository } from './base.repository'
import { db } from '../lib/database'
import { logger } from '../lib/logger'

export class TagRepositoryImpl extends BaseRepository<Tag> {
  protected tableName = 'tag'

  async findByName(name: string): Promise<Tag | null> {
    try {
      const tag = await db.tag.findUnique({
        where: { name }
      })
      return tag
    } catch (error) {
      logger.error('Error finding tag by name', { name, error })
      throw error
    }
  }

  async findOrCreate(name: string): Promise<Tag> {
    try {
      const tag = await db.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
      return tag
    } catch (error) {
      logger.error('Error finding or creating tag', { name, error })
      throw error
    }
  }

  async findManyByNames(names: string[]): Promise<Tag[]> {
    try {
      const tags = await db.tag.findMany({
        where: {
          name: {
            in: names
          }
        }
      })
      return tags
    } catch (error) {
      logger.error('Error finding tags by names', { names, error })
      throw error
    }
  }

  async searchTags(query: string, limit: number = 10): Promise<Tag[]> {
    try {
      const tags = await db.tag.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        take: limit,
        orderBy: {
          name: 'asc'
        }
      })
      return tags
    } catch (error) {
      logger.error('Error searching tags', { query, limit, error })
      throw error
    }
  }

  async getPopularTags(limit: number = 20): Promise<Array<Tag & { _count: { videos: number } }>> {
    try {
      const tags = await db.tag.findMany({
        include: {
          _count: {
            select: {
              videos: true
            }
          }
        },
        orderBy: {
          videos: {
            _count: 'desc'
          }
        },
        take: limit
      })
      return tags
    } catch (error) {
      logger.error('Error getting popular tags', { limit, error })
      throw error
    }
  }

  async getTagsWithVideoCount(): Promise<Array<Tag & { videoCount: number }>> {
    try {
      const tagsWithCount = await db.tag.findMany({
        include: {
          _count: {
            select: {
              videos: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      return tagsWithCount.map(tag => ({
        ...tag,
        videoCount: tag._count.videos
      }))
    } catch (error) {
      logger.error('Error getting tags with video count', { error })
      throw error
    }
  }

  async getTagsByVideoId(videoId: string): Promise<Tag[]> {
    try {
      const videoTags = await db.videoTag.findMany({
        where: { videoId },
        include: {
          tag: true
        }
      })

      return videoTags.map(vt => vt.tag)
    } catch (error) {
      logger.error('Error getting tags by video id', { videoId, error })
      throw error
    }
  }

  async createMultiple(names: string[]): Promise<Tag[]> {
    try {
      // Filter out existing tags
      const existingTags = await this.findManyByNames(names)
      const existingNames = existingTags.map(tag => tag.name)
      const newNames = names.filter(name => !existingNames.includes(name))

      if (newNames.length === 0) {
        return existingTags
      }

      // Create new tags
      const newTags = await db.tag.createMany({
        data: newNames.map(name => ({ name })),
        skipDuplicates: true
      })

      // Return all tags (existing + new)
      return this.findManyByNames(names)
    } catch (error) {
      logger.error('Error creating multiple tags', { names, error })
      throw error
    }
  }

  async getTagUsageStats(tagId: string): Promise<{
    totalVideos: number
    totalRatings: number
    averageRating: number
  }> {
    try {
      const [videoCount, ratingStats] = await Promise.all([
        db.videoTag.count({
          where: { tagId }
        }),
        db.rating.aggregate({
          where: { tagId },
          _count: {
            level: true
          },
          _avg: {
            level: true
          }
        })
      ])

      return {
        totalVideos: videoCount,
        totalRatings: ratingStats._count.level,
        averageRating: ratingStats._avg.level || 0
      }
    } catch (error) {
      logger.error('Error getting tag usage stats', { tagId, error })
      throw error
    }
  }

  async getTrendingTags(days: number = 7, limit: number = 10): Promise<Array<Tag & { recentVideos: number }>> {
    try {
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - days)

      const trendingTags = await db.tag.findMany({
        include: {
          videos: {
            where: {
              video: {
                createdAt: {
                  gte: dateThreshold
                }
              }
            }
          }
        }
      })

      const tagsWithCounts = trendingTags
        .map(tag => ({
          ...tag,
          recentVideos: tag.videos.length
        }))
        .filter(tag => tag.recentVideos > 0)
        .sort((a, b) => b.recentVideos - a.recentVideos)
        .slice(0, limit)

      return tagsWithCounts
    } catch (error) {
      logger.error('Error getting trending tags', { days, limit, error })
      throw error
    }
  }
}

// Export singleton instance
export const tagRepository = new TagRepositoryImpl()