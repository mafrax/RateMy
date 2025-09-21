import { VideoService } from '../../../src/services/video.service'
import { VideoRepository } from '../../../src/repositories/video.repository'
import { TagRepository } from '../../../src/repositories/tag.repository'
import { ValidationError, NotFoundError } from '../../../src/lib/errors'

// Mock dependencies
jest.mock('../../../src/repositories/video.repository')
jest.mock('../../../src/repositories/tag.repository')

const mockVideoRepository = jest.mocked(VideoRepository)
const mockTagRepository = jest.mocked(TagRepository)

describe('VideoService', () => {
  let videoService: VideoService
  let mockVideoRepositoryInstance: jest.Mocked<VideoRepository>
  let mockTagRepositoryInstance: jest.Mocked<TagRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock instances
    mockVideoRepositoryInstance = {
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findByUrl: jest.fn(),
      findByUserId: jest.fn(),
    } as any

    mockTagRepositoryInstance = {
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findByName: jest.fn(),
      createMany: jest.fn(),
    } as any

    // Mock constructors
    mockVideoRepository.mockImplementation(() => mockVideoRepositoryInstance)
    mockTagRepository.mockImplementation(() => mockTagRepositoryInstance)
    
    videoService = new VideoService()
  })

  describe('createVideo', () => {
    const validVideoData = {
      title: 'Test Video',
      originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345',
      description: 'Test description',
      tags: ['tag1', 'tag2']
    }

    const userId = 'user123'

    it('should successfully create a video with tags', async () => {
      const mockCreatedVideo = {
        id: 'video123',
        title: 'Test Video',
        originalUrl: 'https://www.pornhub.com/view_video.php?viewkey=12345',
        embedUrl: 'https://www.pornhub.com/embed/12345',
        description: 'Test description',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [
          { id: 'tag1', name: 'tag1' },
          { id: 'tag2', name: 'tag2' }
        ]
      }

      const mockTags = [
        { id: 'tag1', name: 'tag1', createdAt: new Date(), updatedAt: new Date() },
        { id: 'tag2', name: 'tag2', createdAt: new Date(), updatedAt: new Date() }
      ]

      mockVideoRepositoryInstance.findByUrl.mockResolvedValue(null)
      mockTagRepositoryInstance.findByName.mockImplementation((name) => {
        return Promise.resolve(mockTags.find(tag => tag.name === name) || null)
      })
      mockTagRepositoryInstance.create.mockImplementation((data) => {
        return Promise.resolve({
          id: `tag_${data.name}`,
          name: data.name,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      })
      mockVideoRepositoryInstance.create.mockResolvedValue(mockCreatedVideo)

      const result = await videoService.createVideo(validVideoData, userId)

      expect(result).toEqual(mockCreatedVideo)
      expect(mockVideoRepositoryInstance.findByUrl).toHaveBeenCalledWith(validVideoData.originalUrl)
      expect(mockVideoRepositoryInstance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validVideoData.title,
          originalUrl: validVideoData.originalUrl,
          description: validVideoData.description,
          userId
        })
      )
    })

    it('should throw ValidationError for duplicate URL', async () => {
      const existingVideo = {
        id: 'existing123',
        title: 'Existing Video',
        originalUrl: validVideoData.originalUrl,
        embedUrl: 'embed',
        userId: 'other_user',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockVideoRepositoryInstance.findByUrl.mockResolvedValue(existingVideo)

      await expect(videoService.createVideo(validVideoData, userId))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid URL format', async () => {
      const invalidVideoData = {
        ...validVideoData,
        originalUrl: 'not-a-valid-url'
      }

      await expect(videoService.createVideo(invalidVideoData, userId))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for empty title', async () => {
      const invalidVideoData = {
        ...validVideoData,
        title: ''
      }

      await expect(videoService.createVideo(invalidVideoData, userId))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for too many tags', async () => {
      const invalidVideoData = {
        ...validVideoData,
        tags: Array.from({ length: 15 }, (_, i) => `tag${i}`) // More than 10 tags
      }

      await expect(videoService.createVideo(invalidVideoData, userId))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('getVideo', () => {
    it('should return video with ratings and tags', async () => {
      const mockVideo = {
        id: 'video123',
        title: 'Test Video',
        originalUrl: 'https://example.com/video',
        embedUrl: 'https://example.com/embed',
        description: 'Test description',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        ratings: [
          { id: 'rating1', value: 5, userId: 'user1' },
          { id: 'rating2', value: 4, userId: 'user2' }
        ],
        tags: [
          { id: 'tag1', name: 'tag1' }
        ]
      }

      mockVideoRepositoryInstance.findById.mockResolvedValue(mockVideo)

      const result = await videoService.getVideo('video123')

      expect(result).toEqual(mockVideo)
      expect(mockVideoRepositoryInstance.findById).toHaveBeenCalledWith('video123', {
        includeRatings: true,
        includeTags: true
      })
    })

    it('should throw NotFoundError for non-existent video', async () => {
      mockVideoRepositoryInstance.findById.mockResolvedValue(null)

      await expect(videoService.getVideo('nonexistent'))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('getVideos', () => {
    const mockVideos = [
      {
        id: 'video1',
        title: 'Video 1',
        originalUrl: 'https://example.com/video1',
        embedUrl: 'https://example.com/embed1',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'video2',
        title: 'Video 2',
        originalUrl: 'https://example.com/video2',
        embedUrl: 'https://example.com/embed2',
        userId: 'user456',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should return paginated videos with default options', async () => {
      mockVideoRepositoryInstance.findMany.mockResolvedValue(mockVideos)
      mockVideoRepositoryInstance.count.mockResolvedValue(25)

      const result = await videoService.getVideos()

      expect(result).toEqual({
        videos: mockVideos,
        pagination: {
          page: 1,
          limit: 20,
          total: 25,
          totalPages: 2
        }
      })
      expect(mockVideoRepositoryInstance.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    })

    it('should apply search filters correctly', async () => {
      const searchOptions = {
        page: 2,
        limit: 10,
        search: 'test query',
        tags: ['tag1', 'tag2'],
        userId: 'user123'
      }

      mockVideoRepositoryInstance.findMany.mockResolvedValue([])
      mockVideoRepositoryInstance.count.mockResolvedValue(0)

      await videoService.getVideos(searchOptions)

      expect(mockVideoRepositoryInstance.findMany).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'test query',
        tags: ['tag1', 'tag2'],
        userId: 'user123',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    })

    it('should validate page and limit parameters', async () => {
      const invalidOptions = {
        page: 0,
        limit: -5
      }

      await expect(videoService.getVideos(invalidOptions))
        .rejects.toThrow(ValidationError)
    })

    it('should limit maximum page size', async () => {
      const invalidOptions = {
        limit: 200 // Over maximum of 100
      }

      await expect(videoService.getVideos(invalidOptions))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('updateVideo', () => {
    const videoId = 'video123'
    const userId = 'user123'
    const updateData = {
      title: 'Updated Title',
      description: 'Updated description',
      tags: ['newtag1', 'newtag2']
    }

    it('should successfully update video', async () => {
      const existingVideo = {
        id: videoId,
        title: 'Old Title',
        originalUrl: 'https://example.com/video',
        embedUrl: 'https://example.com/embed',
        description: 'Old description',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedVideo = {
        ...existingVideo,
        title: updateData.title,
        description: updateData.description,
        updatedAt: new Date(),
        tags: [
          { id: 'tag1', name: 'newtag1' },
          { id: 'tag2', name: 'newtag2' }
        ]
      }

      mockVideoRepositoryInstance.findById.mockResolvedValue(existingVideo)
      mockTagRepositoryInstance.findByName.mockResolvedValue(null)
      mockTagRepositoryInstance.create.mockImplementation((data) => 
        Promise.resolve({
          id: `tag_${data.name}`,
          name: data.name,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      )
      mockVideoRepositoryInstance.update.mockResolvedValue(updatedVideo)

      const result = await videoService.updateVideo(videoId, updateData, userId)

      expect(result).toEqual(updatedVideo)
      expect(mockVideoRepositoryInstance.update).toHaveBeenCalledWith(
        videoId,
        expect.objectContaining({
          title: updateData.title,
          description: updateData.description
        })
      )
    })

    it('should throw NotFoundError for non-existent video', async () => {
      mockVideoRepositoryInstance.findById.mockResolvedValue(null)

      await expect(videoService.updateVideo(videoId, updateData, userId))
        .rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for unauthorized user', async () => {
      const existingVideo = {
        id: videoId,
        title: 'Old Title',
        originalUrl: 'https://example.com/video',
        embedUrl: 'https://example.com/embed',
        userId: 'different_user',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockVideoRepositoryInstance.findById.mockResolvedValue(existingVideo)

      await expect(videoService.updateVideo(videoId, updateData, userId))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('deleteVideo', () => {
    const videoId = 'video123'
    const userId = 'user123'

    it('should successfully delete video', async () => {
      const existingVideo = {
        id: videoId,
        title: 'Video to Delete',
        originalUrl: 'https://example.com/video',
        embedUrl: 'https://example.com/embed',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockVideoRepositoryInstance.findById.mockResolvedValue(existingVideo)
      mockVideoRepositoryInstance.delete.mockResolvedValue(undefined)

      await videoService.deleteVideo(videoId, userId)

      expect(mockVideoRepositoryInstance.delete).toHaveBeenCalledWith(videoId)
    })

    it('should throw NotFoundError for non-existent video', async () => {
      mockVideoRepositoryInstance.findById.mockResolvedValue(null)

      await expect(videoService.deleteVideo(videoId, userId))
        .rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for unauthorized user', async () => {
      const existingVideo = {
        id: videoId,
        title: 'Video to Delete',
        originalUrl: 'https://example.com/video',
        embedUrl: 'https://example.com/embed',
        userId: 'different_user',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockVideoRepositoryInstance.findById.mockResolvedValue(existingVideo)

      await expect(videoService.deleteVideo(videoId, userId))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('extractVideoMetadata', () => {
    it('should extract metadata from Pornhub URL', async () => {
      const pornhubUrl = 'https://www.pornhub.com/view_video.php?viewkey=12345'
      
      const result = await videoService.extractVideoMetadata(pornhubUrl)

      expect(result).toEqual({
        embedUrl: 'https://www.pornhub.com/embed/12345',
        platform: 'pornhub',
        videoId: '12345'
      })
    })

    it('should extract metadata from Redgifs URL', async () => {
      const redgifsUrl = 'https://www.redgifs.com/watch/testvideoname'
      
      const result = await videoService.extractVideoMetadata(redgifsUrl)

      expect(result).toEqual({
        embedUrl: 'https://www.redgifs.com/ifr/testvideoname',
        platform: 'redgifs',
        videoId: 'testvideoname'
      })
    })

    it('should extract metadata from XHamster URL', async () => {
      const xhamsterUrl = 'https://xhamster.com/videos/test-video-12345'
      
      const result = await videoService.extractVideoMetadata(xhamsterUrl)

      expect(result).toEqual({
        embedUrl: 'https://xhamster.com/embed/12345',
        platform: 'xhamster',
        videoId: '12345'
      })
    })

    it('should throw ValidationError for unsupported platform', async () => {
      const unsupportedUrl = 'https://youtube.com/watch?v=12345'

      await expect(videoService.extractVideoMetadata(unsupportedUrl))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid URL format', async () => {
      const invalidUrl = 'not-a-url'

      await expect(videoService.extractVideoMetadata(invalidUrl))
        .rejects.toThrow(ValidationError)
    })
  })
})