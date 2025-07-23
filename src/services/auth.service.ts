import bcrypt from 'bcryptjs'
import { User, AuthService, SignInForm, SignUpForm, ApiResponse, Session } from '../types'
import { userRepository } from '../repositories/user.repository'
import { validateSchema, signInSchema, signUpSchema } from '../lib/validation'
import { 
  AuthenticationError, 
  ConflictError, 
  ValidationError,
  createConflictError 
} from '../lib/errors'
import { logger, logUserAction } from '../lib/logger'
import { asyncWrapper } from '../lib/errors'

export class AuthServiceImpl implements AuthService {
  async signIn(credentials: SignInForm): Promise<ApiResponse<Session>> {
    return asyncWrapper(async () => {
      // Validate input
      const validatedCredentials = validateSchema(signInSchema, credentials)
      const { email, password } = validatedCredentials

      logger.info('Sign in attempt', { email })

      // Find user by email
      const user = await userRepository.findByEmail(email)
      if (!user) {
        logUserAction('signin_failed', email, { reason: 'user_not_found' })
        throw new AuthenticationError('Invalid email or password')
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        logUserAction('signin_failed', user.id, { reason: 'invalid_password' })
        throw new AuthenticationError('Invalid email or password')
      }

      logUserAction('signin_success', user.id)

      // Create session data (NextAuth will handle the actual session)
      const sessionData: Session = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }

      return {
        success: true,
        data: sessionData,
      }
    })()
  }

  async signUp(data: SignUpForm): Promise<ApiResponse<User>> {
    return asyncWrapper(async () => {
      // Validate input
      const validatedData = validateSchema(signUpSchema, data)
      const { email, username, password, firstName, lastName } = validatedData

      logger.info('Sign up attempt', { email, username })

      // Check if user already exists
      const existingUser = await userRepository.findByEmailOrUsername(email, username)
      if (existingUser) {
        if (existingUser.email === email) {
          throw createConflictError('User', 'email', email)
        } else {
          throw createConflictError('User', 'username', username)
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password)

      // Create user
      const user = await userRepository.create({
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        avatar: null,
        city: null,
        birthDay: null,
        gender: null,
      })

      logUserAction('signup_success', user.id)

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user

      return {
        success: true,
        data: userWithoutPassword as User,
      }
    })()
  }

  async signOut(): Promise<void> {
    return asyncWrapper(async () => {
      // NextAuth handles the actual sign out
      // This is just for logging and cleanup
      logger.info('User signed out')
    })()
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return asyncWrapper(async () => {
      // This would typically be called with a user ID from the session
      // For now, return a placeholder response
      throw new AuthenticationError('Not implemented')
    })()
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    return asyncWrapper(async () => {
      const user = await userRepository.findById(userId)
      if (!user) {
        return false
      }

      return bcrypt.compare(password, user.password)
    })()
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(userId, currentPassword)
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect')
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long', 'newPassword')
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword)

      // Update user
      await userRepository.update(userId, {
        password: hashedPassword,
      })

      logUserAction('password_changed', userId)

      return {
        success: true,
      }
    })()
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      const user = await userRepository.findByEmail(email)
      if (!user) {
        // Don't reveal if user exists for security
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        }
      }

      // TODO: Generate reset token and send email
      // For now, just log the action
      logUserAction('password_reset_requested', user.id, { email })

      return {
        success: true,
        message: 'Password reset link has been sent to your email.',
      }
    })()
  }

  async validateResetToken(token: string): Promise<ApiResponse<{ userId: string }>> {
    return asyncWrapper(async () => {
      // TODO: Implement token validation
      throw new AuthenticationError('Reset token validation not implemented')
    })()
  }

  async updatePassword(userId: string, newPassword: string): Promise<ApiResponse<void>> {
    return asyncWrapper(async () => {
      // Validate new password
      if (newPassword.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long', 'password')
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword)

      // Update user
      await userRepository.update(userId, {
        password: hashedPassword,
      })

      logUserAction('password_updated', userId)

      return {
        success: true,
      }
    })()
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl()