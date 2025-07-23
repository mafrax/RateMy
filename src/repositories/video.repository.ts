import { Video, VideoRepository, VideoFilters } from '../types'
import { BaseRepository } from './base.repository'
import { db } from '../lib/database'
import { logger } from '../lib/logger'
import { PAGINATION } from '../lib/constants'

export class VideoRepositoryImpl extends BaseRepository<Video> implements VideoRepository {
  protected tableName = 'video'

  async findByUserId(userId: string): Promise<Video[]> {
    try {
      const videos = await db.video.findMany({
        where: { userId },
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
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              ratings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return videos
    } catch (error) {
      logger.error('Error finding videos by user id', { userId, error })
      throw error
    }
  }

  async findByTags(tags: string[]): Promise<Video[]> {
    try {
      const videos = await db.video.findMany({
        where: {
          tags: {
            some: {
              tag: {
                name: {
                  in: tags
                }
              }
            }
          }
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
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              ratings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return videos
    } catch (error) {
      logger.error('Error finding videos by tags', { tags, error })
      throw error
    }
  }

  async search(query: string): Promise<Video[]> {
    try {
      const videos = await db.video.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              tags: {
                some: {
                  tag: {
                    name: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  }
                }
              }
            }
          ]
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
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              ratings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return videos
    } catch (error) {
      logger.error('Error searching videos', { query, error })
      throw error
    }
  }

  async findWithRatings(id: string): Promise<Video | null> {
    try {
      const video = await db.video.findUnique({
        where: { id },
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
          tags: {
            include: {
              tag: true
            }
          },
          ratings: {
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
          },
          _count: {
            select: {
              ratings: true
            }
          }
        }
      })
      return video
    } catch (error) {
      logger.error('Error finding video with ratings', { id, error })
      throw error
    }
  }

  async findWithFilters(filters: VideoFilters): Promise<{
    videos: Video[]
    total: number
    totalPages: number
  }> {
    try {
      const {
        search,
        tags,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = PAGINATION.DEFAULT_PAGE_SIZE
      } = filters

      const where: any = {}

      // Add search filter
      if (search) {
        where.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }

      // Add tags filter
      if (tags && tags.length > 0) {
        where.tags = {
          some: {
            tag: {
              name: {
                in: tags
              }
            }
          }
        }
      }

      // Add user filter
      if (userId) {
        where.userId = userId
      }

      const skip = (page - 1) * limit

      // Build orderBy
      const orderBy: any = {}
      if (sortBy === 'ratings') {
        orderBy._count = {
          ratings: sortOrder
        }
      } else {
        orderBy[sortBy] = sortOrder
      }

      const [videos, total] = await Promise.all([
        db.video.findMany({
          where,
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
            tags: {
              include: {
                tag: true
              }
            },
            ratings: {
              include: {
                tag: true
              }
            },
            _count: {
              select: {
                ratings: true
              }
            }
          },
          orderBy,
          skip,
          take: limit,
        }),
        db.video.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        videos,
        total,
        totalPages
      }
    } catch (error) {
      logger.error('Error finding videos with filters', { filters, error })
      throw error
    }
  }

  async createWithTags(
    videoData: Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'user' | 'tags' | 'ratings'>,
    tagNames: string[]
  ): Promise<Video> {
    try {
      const video = await db.video.create({
        data: {
          ...videoData,
          tags: {
            create: tagNames.map(tagName => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName }
                }
              }
            }))
          }
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
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              ratings: true
            }
          }
        }
      })

      logger.info('Created video with tags', { videoId: video.id, tagNames })
      return video
    } catch (error) {
      logger.error('Error creating video with tags', { videoData, tagNames, error })
      throw error
    }
  }

  async getVideoStats(videoId: string): Promise<{
    totalRatings: number
    averageRatingByTag: Array<{ tagName: string; averageRating: number; count: number }>
  }> {
    try {
      const [totalRatings, ratingsByTag] = await Promise.all([
        db.rating.count({
          where: { videoId }
        }),
        db.rating.groupBy({
          by: ['tagId'],
          where: { videoId },
          _avg: {
            level: true
          },
          _count: {
            level: true
          }
        })
      ])

      // Get tag names
      const tagIds = ratingsByTag.map(r => r.tagId)
      const tags = await db.tag.findMany({
        where: {
          id: {
            in: tagIds
          }
        }
      })

      const tagMap = tags.reduce((acc, tag) => {
        acc[tag.id] = tag.name
        return acc
      }, {} as Record<string, string>)

      const averageRatingByTag = ratingsByTag.map(rating => ({
        tagName: tagMap[rating.tagId] || 'Unknown',
        averageRating: rating._avg.level || 0,
        count: rating._count.level
      }))

      return {
        totalRatings,
        averageRatingByTag
      }
    } catch (error) {
      logger.error('Error getting video stats', { videoId, error })
      throw error
    }
  }

  async getTrendingVideos(limit: number = 10): Promise<Video[]> {
    try {
      // Get videos with most ratings in the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const videos = await db.video.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
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
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              ratings: true
            }
          }
        },
        orderBy: {
          ratings: {
            _count: 'desc'
          }
        },
        take: limit
      })

      return videos
    } catch (error) {
      logger.error('Error getting trending videos', { limit, error })
      throw error
    }
  }
}

// Export singleton instance
export const videoRepository = new VideoRepositoryImpl()