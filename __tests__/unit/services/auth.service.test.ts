import { AuthService } from '../../../src/services/auth.service'
import { UserRepository } from '../../../src/repositories/user.repository'
import bcryptjs from 'bcryptjs'
import { ValidationError, AuthenticationError } from '../../../src/lib/errors'

// Mock dependencies
jest.mock('../../../src/repositories/user.repository')
jest.mock('bcryptjs')

const mockUserRepository = jest.mocked(UserRepository)
const mockBcrypt = jest.mocked(bcryptjs)

describe('AuthService', () => {
  let authService: AuthService
  let mockUserRepositoryInstance: jest.Mocked<UserRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock instance
    mockUserRepositoryInstance = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    } as any

    // Mock constructor
    mockUserRepository.mockImplementation(() => mockUserRepositoryInstance)
    
    authService = new AuthService()
  })

  describe('validateCredentials', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    it('should successfully validate correct credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true as never)

      const result = await authService.validateCredentials(validCredentials)

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        isActive: mockUser.isActive
      })
      expect(mockUserRepositoryInstance.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword')
    })

    it('should throw AuthenticationError for non-existent user', async () => {
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null)

      await expect(authService.validateCredentials(validCredentials))
        .rejects.toThrow(AuthenticationError)
    })

    it('should throw AuthenticationError for incorrect password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(false as never)

      await expect(authService.validateCredentials(validCredentials))
        .rejects.toThrow(AuthenticationError)
    })

    it('should throw AuthenticationError for inactive user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true as never)

      await expect(authService.validateCredentials(validCredentials))
        .rejects.toThrow(AuthenticationError)
    })

    it('should throw ValidationError for invalid email format', async () => {
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'password123'
      }

      await expect(authService.validateCredentials(invalidCredentials))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for short password', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: '123'
      }

      await expect(authService.validateCredentials(invalidCredentials))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('createUser', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    }

    it('should successfully create a new user', async () => {
      const hashedPassword = 'hashedpassword'
      const mockCreatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null)
      mockUserRepositoryInstance.findByUsername.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
      mockUserRepositoryInstance.create.mockResolvedValue(mockCreatedUser)

      const result = await authService.createUser(validUserData)

      expect(result).toEqual({
        id: mockCreatedUser.id,
        email: mockCreatedUser.email,
        username: mockCreatedUser.username,
        isActive: mockCreatedUser.isActive
      })
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12)
      expect(mockUserRepositoryInstance.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword
      })
    })

    it('should throw ValidationError for duplicate email', async () => {
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        username: 'existinguser',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(existingUser)

      await expect(authService.createUser(validUserData))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for duplicate username', async () => {
      const existingUser = {
        id: '1',
        email: 'other@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null)
      mockUserRepositoryInstance.findByUsername.mockResolvedValue(existingUser)

      await expect(authService.createUser(validUserData))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid email format', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123'
      }

      await expect(authService.createUser(invalidUserData))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid username format', async () => {
      const invalidUserData = {
        email: 'test@example.com',
        username: 'ab', // too short
        password: 'password123'
      }

      await expect(authService.createUser(invalidUserData))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for weak password', async () => {
      const invalidUserData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123'
      }

      await expect(authService.createUser(invalidUserData))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile for valid user ID', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findById.mockResolvedValue(mockUser)

      const result = await authService.getUserProfile('1')

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      })
      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledWith('1')
    })

    it('should throw AuthenticationError for non-existent user', async () => {
      mockUserRepositoryInstance.findById.mockResolvedValue(null)

      await expect(authService.getUserProfile('999'))
        .rejects.toThrow(AuthenticationError)
    })
  })

  describe('updateUserProfile', () => {
    const updateData = {
      username: 'newusername',
      email: 'newemail@example.com'
    }

    it('should successfully update user profile', async () => {
      const existingUser = {
        id: '1',
        email: 'old@example.com',
        username: 'oldusername',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedUser = {
        ...existingUser,
        email: 'newemail@example.com',
        username: 'newusername',
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findById.mockResolvedValue(existingUser)
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null)
      mockUserRepositoryInstance.findByUsername.mockResolvedValue(null)
      mockUserRepositoryInstance.update.mockResolvedValue(updatedUser)

      const result = await authService.updateUserProfile('1', updateData)

      expect(result).toEqual({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      })
    })

    it('should throw AuthenticationError for non-existent user', async () => {
      mockUserRepositoryInstance.findById.mockResolvedValue(null)

      await expect(authService.updateUserProfile('999', updateData))
        .rejects.toThrow(AuthenticationError)
    })

    it('should throw ValidationError for duplicate email', async () => {
      const existingUser = {
        id: '1',
        email: 'old@example.com',
        username: 'oldusername',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const duplicateEmailUser = {
        id: '2',
        email: 'newemail@example.com',
        username: 'otheruser',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findById.mockResolvedValue(existingUser)
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(duplicateEmailUser)

      await expect(authService.updateUserProfile('1', updateData))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123'
    }

    it('should successfully change password', async () => {
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'oldhash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedUser = {
        ...existingUser,
        passwordHash: 'newhash',
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findById.mockResolvedValue(existingUser)
      mockBcrypt.compare.mockResolvedValue(true as never)
      mockBcrypt.hash.mockResolvedValue('newhash' as never)
      mockUserRepositoryInstance.update.mockResolvedValue(updatedUser)

      await authService.changePassword('1', passwordData)

      expect(mockBcrypt.compare).toHaveBeenCalledWith('oldpassword', 'oldhash')
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)
      expect(mockUserRepositoryInstance.update).toHaveBeenCalledWith('1', {
        passwordHash: 'newhash'
      })
    })

    it('should throw AuthenticationError for incorrect current password', async () => {
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'oldhash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepositoryInstance.findById.mockResolvedValue(existingUser)
      mockBcrypt.compare.mockResolvedValue(false as never)

      await expect(authService.changePassword('1', passwordData))
        .rejects.toThrow(AuthenticationError)
    })

    it('should throw ValidationError for weak new password', async () => {
      const weakPasswordData = {
        currentPassword: 'oldpassword',
        newPassword: '123'
      }

      await expect(authService.changePassword('1', weakPasswordData))
        .rejects.toThrow(ValidationError)
    })
  })
})