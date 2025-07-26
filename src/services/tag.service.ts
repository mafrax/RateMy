import { tagRepository } from '../repositories/tag.repository'
import { ApiResponse } from '../types'
import { asyncWrapper } from '../lib/errors'
import { logger } from '../lib/logger'

export class TagServiceImpl {
  async getOrCreateTag(name: string): Promise<{ id: string; name: string }> {
    try {
      // Normalize tag name
      const normalizedName = name.toLowerCase().trim()
      
      if (!normalizedName) {
        throw new Error('Tag name cannot be empty')
      }

      // Try to find existing tag
      let tag = await tagRepository.findByName(normalizedName)
      
      // If not found, create it
      if (!tag) {
        tag = await tagRepository.create({ name: normalizedName })
        logger.info('Created new tag', { tagName: normalizedName })
      }

      return tag
    } catch (error) {
      logger.error('Error getting or creating tag', { name, error })
      throw error
    }
  }

  async getAllTags(): Promise<ApiResponse<Array<{ id: string; name: string; _count: { videos: number } }>>> {
    return asyncWrapper(async () => {
      const tags = await tagRepository.findAllWithCounts()
      
      return {
        success: true,
        data: tags,
      }
    })()
  }

  async getPopularTags(limit: number = 20): Promise<ApiResponse<Array<{ id: string; name: string; _count: { videos: number } }>>> {
    return asyncWrapper(async () => {
      const tags = await tagRepository.findPopular(limit)
      
      return {
        success: true,
        data: tags,
      }
    })()
  }

  async searchTags(query: string): Promise<ApiResponse<Array<{ id: string; name: string }>>> {
    return asyncWrapper(async () => {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required')
      }

      const tags = await tagRepository.search(query.trim().toLowerCase())
      
      return {
        success: true,
        data: tags,
      }
    })()
  }
}

// Export singleton instance
export const tagService = new TagServiceImpl()