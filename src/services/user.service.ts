import { 
  User, 
  Follow,
  ApiResponse 
} from '../types'
import { userRepository } from '../repositories/user.repository'
import { 
  validateSchema, 
  updateUserSchema,
  validateOptionalString 
} from '../lib/validation'
import { 
  NotFoundError, 
  AuthorizationError,
  ConflictError,
  createNotFoundError 
} from '../lib/errors'
import { logger, logUserAction } from '../lib/logger'
import { asyncWrapper } from '../lib/errors'

export class UserServiceImpl {
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return asyncWrapper(async () => {
      const user = await userRepository.findById(id)
      
      if (!user) {
        throw createNotFoundError('User', id)
      }

      // User type doesn't include password, so just return as is
      return {
        success: true,
        data: user,
      }
    })()
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return asyncWrapper(async () => {
      // Check if user exists
      const existingUser = await userRepository.findById(id)
      if (!existingUser) {
        throw createNotFoundError('User', id)
      }

      // Validate input
      const validatedData = validateSchema(updateUserSchema, data)

      // Update user
      const updatedUser = await userRepository.update(id, validatedData)

      logUserAction('profile_updated', id)

      // User type doesn't include password, so just return as is
      return {
        success: true,
        data: updatedUser,
      }
    })()
  }

  async followUser(followerId: string, followingId: string): Promise<ApiResponse<Follow>> {
    return asyncWrapper(async () => {
      // Prevent self-following
      if (followerId === followingId) {
        throw new ValidationError('You cannot follow yourself')
      }

      // Check if both users exist
      const [follower, following] = await Promise.all([
        userRepository.findById(followerId),
        userRepository.findById(followingId),
      ])

      if (!follower) {
        throw createNotFoundError('Follower', followerId)
      }

      if (!following) {
        throw createNotFoundError('User to follow', followingId)
      }

      // Check if already following
      const isAlreadyFollowing = await userRepository.isFollowing(followerId, followingId)
      if (isAlreadyFollowing) {
        throw new ConflictError('You are already following this user')
      }

      // Create follow relationship
      await userRepository.follow(followerId, followingId)

      logUserAction('user_followed', followerId, { followingId })

      return {
        success: true,
        data: {
          id: `${followerId}_${followingId}`, // Composite ID
          followerId,
          followingId,
          createdAt: new Date(),
        } as Follow,
      }
    })()
  }

  async unfollowUser(followerId: string, followingId: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      // Check if following relationship exists
      const isFollowing = await userRepository.isFollowing(followerId, followingId)
      if (!isFollowing) {
        throw createNotFoundError('Follow relationship')
      }

      // Remove follow relationship
      await userRepository.unfollow(followerId, followingId)

      logUserAction('user_unfollowed', followerId, { followingId })

      return {
        success: true,
      }
    })()
  }

  async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    return asyncWrapper(async () => {
      // Check if user exists
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      const followers = await userRepository.findFollowers(userId)

      return {
        success: true,
        data: followers,
      }
    })()
  }

  async getFollowing(userId: string): Promise<ApiResponse<User[]>> {
    return asyncWrapper(async () => {
      // Check if user exists
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      const following = await userRepository.findFollowing(userId)

      return {
        success: true,
        data: following,
      }
    })()
  }

  async getUserWithStats(id: string): Promise<ApiResponse<User & { 
    _count: { followers: number; following: number; videos: number } 
  }>> {
    return asyncWrapper(async () => {
      const userWithStats = await userRepository.findWithStats(id)
      
      if (!userWithStats) {
        throw createNotFoundError('User', id)
      }

      // User type doesn't include password, so just return as is
      return {
        success: true,
        data: userWithStats as User & { 
          _count: { followers: number; following: number; videos: number } 
        },
      }
    })()
  }

  async searchUsers(query: string, limit: number = 10): Promise<ApiResponse<User[]>> {
    return asyncWrapper(async () => {
      if (!query || query.trim().length === 0) {
        throw new ValidationError('Search query is required', 'query')
      }

      if (query.trim().length < 2) {
        throw new ValidationError('Search query must be at least 2 characters long', 'query')
      }

      const users = await userRepository.searchUsers(query.trim(), limit)

      return {
        success: true,
        data: users,
      }
    })()
  }

  async checkUsername(username: string): Promise<ApiResponse<{ available: boolean }>> {
    return asyncWrapper(async () => {
      if (!username || username.trim().length === 0) {
        throw new ValidationError('Username is required', 'username')
      }

      const existingUser = await userRepository.findByUsername(username.trim())
      const available = !existingUser

      return {
        success: true,
        data: { available },
      }
    })()
  }

  async checkEmail(email: string): Promise<ApiResponse<{ available: boolean }>> {
    return asyncWrapper(async () => {
      if (!email || email.trim().length === 0) {
        throw new ValidationError('Email is required', 'email')
      }

      const existingUser = await userRepository.findByEmail(email.trim())
      const available = !existingUser

      return {
        success: true,
        data: { available },
      }
    })()
  }

  async isFollowing(followerId: string, followingId: string): Promise<ApiResponse<{ following: boolean }>> {
    return asyncWrapper(async () => {
      const following = await userRepository.isFollowing(followerId, followingId)

      return {
        success: true,
        data: { following },
      }
    })()
  }

  async getFollowCounts(userId: string): Promise<ApiResponse<{ followers: number; following: number }>> {
    return asyncWrapper(async () => {
      // Check if user exists
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      const counts = await userRepository.getFollowCounts(userId)

      return {
        success: true,
        data: counts,
      }
    })()
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<ApiResponse<User>> {
    return asyncWrapper(async () => {
      // Check if user exists
      const existingUser = await userRepository.findById(userId)
      if (!existingUser) {
        throw createNotFoundError('User', userId)
      }

      // Validate avatar URL (basic validation)
      const validatedAvatarUrl = validateOptionalString(avatarUrl, 'avatarUrl', 500)

      // Update user avatar
      const updatedUser = await userRepository.update(userId, {
        avatar: validatedAvatarUrl,
      })

      logUserAction('avatar_updated', userId)

      // User type doesn't include password, so just return as is
      return {
        success: true,
        data: updatedUser,
      }
    })()
  }

  async deactivateUser(userId: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      // Check if user exists
      const user = await userRepository.findById(userId)
      if (!user) {
        throw createNotFoundError('User', userId)
      }

      // TODO: Implement user deactivation logic
      // This might involve soft deletion or status change
      // For now, we'll just log the action
      
      logUserAction('user_deactivated', userId)

      return {
        success: true,
        message: 'User deactivation not yet implemented',
      }
    })()
  }
}

// Helper function for validation error
class ValidationError extends Error {
  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Export singleton instance
export const userService = new UserServiceImpl()