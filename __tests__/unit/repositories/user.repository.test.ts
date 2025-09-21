import { UserRepository } from '../../../src/repositories/user.repository'
import { PrismaClient } from '@prisma/client'
import { DatabaseError } from '../../../src/lib/errors'

// Mock Prisma
jest.mock('@prisma/client')
jest.mock('../../../src/lib/database', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

import { db } from '../../../src/lib/database'

const mockDb = jest.mocked(db)

describe('UserRepository', () => {
  let userRepository: UserRepository

  beforeEach(() => {
    jest.clearAllMocks()
    userRepository = new UserRepository()
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.findUnique.mockResolvedValue(mockUser)

      const result = await userRepository.findById('1')

      expect(result).toEqual(mockUser)
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      })
    })

    it('should return null when user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await userRepository.findById('999')

      expect(result).toBeNull()
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: '999' }
      })
    })

    it('should throw DatabaseError on database error', async () => {
      const dbError = new Error('Database connection failed')
      mockDb.user.findUnique.mockRejectedValue(dbError)

      await expect(userRepository.findById('1'))
        .rejects.toThrow(DatabaseError)
    })
  })

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.findUnique.mockResolvedValue(mockUser)

      const result = await userRepository.findByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
    })

    it('should return null when user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await userRepository.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.findUnique.mockResolvedValue(mockUser)

      const result = await userRepository.findByUsername('testuser')

      expect(result).toEqual(mockUser)
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' }
      })
    })

    it('should return null when user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await userRepository.findByUsername('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashedpassword'
    }

    it('should create and return new user', async () => {
      const mockCreatedUser = {
        id: '1',
        ...userData,
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.create.mockResolvedValue(mockCreatedUser)

      const result = await userRepository.create(userData)

      expect(result).toEqual(mockCreatedUser)
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: userData
      })
    })

    it('should throw DatabaseError on database constraint violation', async () => {
      const dbError = new Error('Unique constraint violation')
      dbError.name = 'PrismaClientKnownRequestError'
      ;(dbError as any).code = 'P2002'

      mockDb.user.create.mockRejectedValue(dbError)

      await expect(userRepository.create(userData))
        .rejects.toThrow(DatabaseError)
    })
  })

  describe('update', () => {
    const updateData = {
      email: 'updated@example.com',
      username: 'updateduser'
    }

    it('should update and return user', async () => {
      const mockUpdatedUser = {
        id: '1',
        email: 'updated@example.com',
        username: 'updateduser',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.update.mockResolvedValue(mockUpdatedUser)

      const result = await userRepository.update('1', updateData)

      expect(result).toEqual(mockUpdatedUser)
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData
      })
    })

    it('should throw DatabaseError when user not found', async () => {
      const dbError = new Error('Record not found')
      dbError.name = 'PrismaClientKnownRequestError'
      ;(dbError as any).code = 'P2025'

      mockDb.user.update.mockRejectedValue(dbError)

      await expect(userRepository.update('999', updateData))
        .rejects.toThrow(DatabaseError)
    })
  })

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockDeletedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.delete.mockResolvedValue(mockDeletedUser)

      await userRepository.delete('1')

      expect(mockDb.user.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      })
    })

    it('should throw DatabaseError when user not found', async () => {
      const dbError = new Error('Record not found')
      dbError.name = 'PrismaClientKnownRequestError'
      ;(dbError as any).code = 'P2025'

      mockDb.user.delete.mockRejectedValue(dbError)

      await expect(userRepository.delete('999'))
        .rejects.toThrow(DatabaseError)
    })
  })

  describe('findMany', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        username: 'user1',
        passwordHash: 'hash1',
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        email: 'user2@example.com',
        username: 'user2',
        passwordHash: 'hash2',
        isActive: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]

    it('should return paginated users with default options', async () => {
      mockDb.user.findMany.mockResolvedValue(mockUsers)

      const result = await userRepository.findMany()

      expect(result).toEqual(mockUsers)
      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should apply pagination parameters correctly', async () => {
      const options = {
        page: 2,
        limit: 10
      }

      mockDb.user.findMany.mockResolvedValue([])

      await userRepository.findMany(options)

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        skip: 10, // (page - 1) * limit = (2 - 1) * 10
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should apply search filter when provided', async () => {
      const options = {
        search: 'test'
      }

      mockDb.user.findMany.mockResolvedValue([])

      await userRepository.findMany(options)

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {
          OR: [
            { username: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should apply active filter when provided', async () => {
      const options = {
        isActive: true
      }

      mockDb.user.findMany.mockResolvedValue([])

      await userRepository.findMany(options)

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should apply multiple filters when provided', async () => {
      const options = {
        search: 'test',
        isActive: true,
        page: 3,
        limit: 5
      }

      mockDb.user.findMany.mockResolvedValue([])

      await userRepository.findMany(options)

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        skip: 10, // (3 - 1) * 5
        take: 5,
        where: {
          isActive: true,
          OR: [
            { username: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('count', () => {
    it('should return total count without filters', async () => {
      mockDb.user.count.mockResolvedValue(50)

      const result = await userRepository.count()

      expect(result).toBe(50)
      expect(mockDb.user.count).toHaveBeenCalledWith({})
    })

    it('should return filtered count', async () => {
      const filters = {
        isActive: true
      }

      mockDb.user.count.mockResolvedValue(30)

      const result = await userRepository.count(filters)

      expect(result).toBe(30)
      expect(mockDb.user.count).toHaveBeenCalledWith({
        where: {
          isActive: true
        }
      })
    })

    it('should return count with search filter', async () => {
      const filters = {
        search: 'test'
      }

      mockDb.user.count.mockResolvedValue(5)

      const result = await userRepository.count(filters)

      expect(result).toBe(5)
      expect(mockDb.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } }
          ]
        }
      })
    })
  })
})