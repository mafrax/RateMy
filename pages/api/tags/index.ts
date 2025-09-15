import { createApiRoute } from '@/src/lib/api-handler'
import { tagService } from '@/src/services/tag.service'

export default createApiRoute({
  GET: async (ctx) => {
    const { q: query } = ctx.req.query
    
    if (query && typeof query === 'string') {
      // Search for tags matching the query
      const result = await tagService.searchTags(query)
      return result
    } else {
      // Get all tags
      const result = await tagService.getAllTags()
      return result
    }
  }
}, {
  methods: ['GET'],
  requireAuth: false
})