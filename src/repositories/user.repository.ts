import { User, UserRepository } from '../types'
import { BaseRepository } from './base.repository'
import { db } from '../lib/db'
import { logger } from '../lib/logger'

export class UserRepositoryImpl extends BaseRepository<User> implements UserRepository {
  protected tableName = 'user'

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { email }
      })
      return user
    } catch (error) {
      logger.error('Error finding user by email', { email, error })
      throw error
    }
  }

  async findByEmailWithPassword(email: string): Promise<any | null> {
    try {
      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          password: true,
          avatar: true,
          city: true,
          birthDay: true,
          gender: true,
          createdAt: true,
          updatedAt: true
        }
      })
      return user
    } catch (error) {
      logger.error('Error finding user by email with password', { email, error })
      throw error
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { username }
      })
      return user
    } catch (error) {
      logger.error('Error finding user by username', { username, error })
      throw error
    }
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    try {
      const user = await db.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      })
      return user
    } catch (error) {
      logger.error('Error finding user by email or username', { email, username, error })
      throw error
    }
  }

  async findFollowers(userId: string): Promise<User[]> {
    try {
      const followers = await db.user.findMany({
        where: {
          following: {
            some: {
              followingId: userId
            }
          }
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          city: true,
          birthDay: true,
          gender: true,
        }
      })
      return followers
    } catch (error) {
      logger.error('Error finding followers', { userId, error })
      throw error
    }
  }

  async findFollowing(userId: string): Promise<User[]> {
    try {
      const following = await db.user.findMany({
        where: {
          followers: {
            some: {
              followerId: userId
            }
          }
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          city: true,
          birthDay: true,
          gender: true,
        }
      })
      return following
    } catch (error) {
      logger.error('Error finding following', { userId, error })
      throw error
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      })
      return !!follow
    } catch (error) {
      logger.error('Error checking if user is following', { followerId, followingId, error })
      throw error
    }
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    try {
      await db.follow.create({
        data: {
          followerId,
          followingId
        }
      })
      logger.info('User followed', { followerId, followingId })
    } catch (error) {
      logger.error('Error following user', { followerId, followingId, error })
      throw error
    }
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    try {
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      })
      logger.info('User unfollowed', { followerId, followingId })
    } catch (error) {
      logger.error('Error unfollowing user', { followerId, followingId, error })
      throw error
    }
  }

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    try {
      const [followers, following] = await Promise.all([
        db.follow.count({
          where: { followingId: userId }
        }),
        db.follow.count({
          where: { followerId: userId }
        })
      ])

      return { followers, following }
    } catch (error) {
      logger.error('Error getting follow counts', { userId, error })
      throw error
    }
  }

  async findWithStats(id: string): Promise<(User & { _count: { followers: number; following: number; videos: number } }) | null> {
    try {
      const user = await db.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
              videos: true
            }
          }
        }
      })
      return user
    } catch (error) {
      logger.error('Error finding user with stats', { id, error })
      throw error
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      const users = await db.user.findMany({
        where: {
          OR: [
            {
              username: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              firstName: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              lastName: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        take: limit,
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          city: true,
          birthDay: true,
          gender: true,
        }
      })
      return users
    } catch (error) {
      logger.error('Error searching users', { query, limit, error })
      throw error
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepositoryImpl()