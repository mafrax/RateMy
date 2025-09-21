import { createMocks } from 'node-mocks-http'
import { getSession } from 'next-auth/react'
import handler from '../../../pages/api/videos'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('../../../src/services/video.service')

const mockGetSession = jest.mocked(getSession)

describe('/api/videos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/videos', () => {
    it('should return videos list without authentication', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10'
        }
      })

      // Mock no session (unauthenticated user)
      mockGetSession.mockResolvedValue(null)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data).toEqual({
        success: true,
        data: expect.objectContaining({
          videos: expect.any(Array),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number)
          })
        })
      })
    })

    it('should handle search query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          search: 'test query',
          tags: 'tag1,tag2',
          page: '2',
          limit: '5'
        }
      })

      mockGetSession.mockResolvedValue(null)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should validate pagination parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '0', // invalid page
          limit: '200' // invalid limit (too high)
        }
      })

      mockGetSession.mockResolvedValue(null)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.message).toContain('validation')
    })
  })

  describe('POST /api/videos', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      isAdmin: false
    }

    it('should create video with valid data and authentication', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Video',
          originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345',
          description: 'Test description',
          tags: ['tag1', 'tag2']
        }
      })

      mockGetSession.mockResolvedValue({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          originalUrl: expect.any(String),
          userId: mockUser.id
        })
      )
    })

    it('should reject video creation without authentication', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Video',
          originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345'
        }
      })

      mockGetSession.mockResolvedValue(null)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.message).toContain('Authentication required')
    })

    it('should validate video creation data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'a'.repeat(201), // title too long
          originalUrl: 'invalid-url', // invalid URL
          description: 'a'.repeat(1001) // description too long
        }
      })

      mockGetSession.mockResolvedValue({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.message).toContain('validation')
    })

    it('should handle missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Video'
          // missing originalUrl
        }
      })

      mockGetSession.mockResolvedValue({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
    })
  })

  describe('Unsupported methods', () => {
    it('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT'
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.message).toContain('Method not allowed')
    })

    it('should reject DELETE requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE'
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      // Mock VideoService to throw an error
      const VideoService = require('../../../src/services/video.service').VideoService
      const mockVideoService = new VideoService()
      mockVideoService.getVideos = jest.fn().mockRejectedValue(new Error('Database error'))

      await handler(req, res)

      // Should return 500 for unhandled errors
      expect(res._getStatusCode()).toBe(500)
    })

    it('should handle malformed JSON in request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        }
      })

      // Set malformed JSON directly
      req._setBody('{"invalid": json}')

      mockGetSession.mockResolvedValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          username: 'testuser'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
    })
  })
})