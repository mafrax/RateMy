import { Rating } from '../types'
import { BaseRepository } from './base.repository'
import { db } from '../lib/database'
import { logger } from '../lib/logger'

export class RatingRepositoryImpl extends BaseRepository<Rating> {
  protected tableName = 'rating'

  async findByVideoId(videoId: string): Promise<Rating[]> {
    try {
      const ratings = await db.rating.findMany({
        where: { videoId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          tag: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return ratings
    } catch (error) {
      logger.error('Error finding ratings by video id', { videoId, error })
      throw error
    }
  }

  async findByUserId(userId: string): Promise<Rating[]> {
    try {
      const ratings = await db.rating.findMany({
        where: { userId },
        include: {
          video: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            }
          },
          tag: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return ratings
    } catch (error) {
      logger.error('Error finding ratings by user id', { userId, error })
      throw error
    }
  }

  async findByUserAndVideo(userId: string, videoId: string): Promise<Rating[]> {
    try {
      const ratings = await db.rating.findMany({
        where: {
          userId,
          videoId
        },
        include: {
          tag: true
        }
      })
      return ratings
    } catch (error) {
      logger.error('Error finding ratings by user and video', { userId, videoId, error })
      throw error
    }
  }

  async upsertRating(
    videoId: string,
    userId: string,
    tagId: string,
    level: number
  ): Promise<Rating> {
    try {
      const rating = await db.rating.upsert({
        where: {
          videoId_userId_tagId: {
            videoId,
            userId,
            tagId
          }
        },
        update: {
          level
        },
        create: {
          videoId,
          userId,
          tagId,
          level
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          tag: true
        }
      })

      logger.info('Upserted rating', { videoId, userId, tagId, level })
      return rating
    } catch (error) {
      logger.error('Error upserting rating', { videoId, userId, tagId, level, error })
      throw error
    }
  }

  async deleteRating(videoId: string, userId: string, tagId: string): Promise<void> {
    try {
      await db.rating.delete({
        where: {
          videoId_userId_tagId: {
            videoId,
            userId,
            tagId
          }
        }
      })

      logger.info('Deleted rating', { videoId, userId, tagId })
    } catch (error) {
      logger.error('Error deleting rating', { videoId, userId, tagId, error })
      throw error
    }
  }

  async getAverageRating(videoId: string, tagId?: string): Promise<number> {
    try {
      const where: any = { videoId }
      if (tagId) {
        where.tagId = tagId
      }

      const result = await db.rating.aggregate({
        where,
        _avg: {
          level: true
        }
      })

      return result._avg.level || 0
    } catch (error) {
      logger.error('Error getting average rating', { videoId, tagId, error })
      throw error
    }
  }

  async getRatingDistribution(videoId: string, tagId?: string): Promise<Array<{ level: number; count: number }>> {
    try {
      const where: any = { videoId }
      if (tagId) {
        where.tagId = tagId
      }

      const distribution = await db.rating.groupBy({
        by: ['level'],
        where,
        _count: {
          level: true
        },
        orderBy: {
          level: 'asc'
        }
      })

      return distribution.map(item => ({
        level: item.level,
        count: item._count.level
      }))
    } catch (error) {
      logger.error('Error getting rating distribution', { videoId, tagId, error })
      throw error
    }
  }

  async getUserRatingForVideo(
    userId: string,
    videoId: string,
    tagId: string
  ): Promise<Rating | null> {
    try {
      const rating = await db.rating.findUnique({
        where: {
          videoId_userId_tagId: {
            videoId,
            userId,
            tagId
          }
        },
        include: {
          tag: true
        }
      })
      return rating
    } catch (error) {
      logger.error('Error getting user rating for video', { userId, videoId, tagId, error })
      throw error
    }
  }

  async getTopRatedVideos(limit: number = 10, tagId?: string): Promise<Array<{
    videoId: string;
    averageRating: number;
    ratingCount: number;
  }>> {
    try {
      const where: any = {}
      if (tagId) {
        where.tagId = tagId
      }

      const topRated = await db.rating.groupBy({
        by: ['videoId'],
        where,
        _avg: {
          level: true
        },
        _count: {
          level: true
        },
        having: {
          level: {
            _count: {
              gte: 3 // At least 3 ratings to be considered
            }
          }
        },
        orderBy: {
          _avg: {
            level: 'desc'
          }
        },
        take: limit
      })

      return topRated.map(item => ({
        videoId: item.videoId,
        averageRating: item._avg.level || 0,
        ratingCount: item._count.level
      }))
    } catch (error) {
      logger.error('Error getting top rated videos', { limit, tagId, error })
      throw error
    }
  }
}

// Export singleton instance
export const ratingRepository = new RatingRepositoryImpl()