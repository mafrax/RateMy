import { createApiRoute, validateBody } from '@/src/lib/api-handler'
import { z } from 'zod'

const testSchema = z.object({
  url: z.string().url()
})

export default createApiRoute({
  POST: validateBody(testSchema, async (ctx, body: z.infer<typeof testSchema>) => {
    const { url } = body

    try {
      console.log('=== XHAMSTER DEBUG TEST ===')
      console.log('Testing URL:', url)
      
      // Fetch the HTML page with enhanced headers to bypass bot detection
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'Pragma': 'no-cache',
          'Referer': 'https://www.google.com/'
        }
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`Failed to fetch XHamster page: ${response.status}`)
      }

      const html = await response.text()
      console.log('HTML length:', html.length)
      
      // Sample first 3000 characters
      const htmlSample = html.substring(0, 3000)
      console.log('HTML sample (first 3000 chars):', htmlSample)
      
      // Test title extraction patterns
      const titlePatterns = [
        /<title[^>]*>([^<]+)<\/title>/i,
        /<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i,
        /<meta[^>]*name="title"[^>]*content="([^"]*)"[^>]*>/i
      ]
      
      console.log('=== TESTING TITLE PATTERNS ===')
      titlePatterns.forEach((pattern, index) => {
        const match = html.match(pattern)
        console.log(`Pattern ${index + 1}:`, pattern.toString())
        console.log(`Match:`, match ? match[1] : 'No match')
      })
      
      // Test description patterns
      const descPatterns = [
        /<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i,
        /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
      ]
      
      console.log('=== TESTING DESCRIPTION PATTERNS ===')
      descPatterns.forEach((pattern, index) => {
        const match = html.match(pattern)
        console.log(`Pattern ${index + 1}:`, pattern.toString())
        console.log(`Match:`, match ? match[1] : 'No match')
      })
      
      // Test thumbnail patterns
      const thumbPatterns = [
        /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i,
        /https:\/\/ic-vt-[^"]*\.xhpingcdn\.com\/[^"]*\.jpg/g,
        /https:\/\/thumb-[^"]*\.xhpingcdn\.com\/[^"]*\.jpg/g
      ]
      
      console.log('=== TESTING THUMBNAIL PATTERNS ===')
      thumbPatterns.forEach((pattern, index) => {
        const match = html.match(pattern)
        console.log(`Pattern ${index + 1}:`, pattern.toString())
        console.log(`Match:`, match ? (Array.isArray(match) ? match[0] : match[1]) : 'No match')
      })
      
      // Look for video tags container
      const videoTagsContainerRegex = /<nav[^>]*id="video-tags-list-container"[^>]*>([\s\S]*?)<\/nav>/i
      const videoTagsMatch = html.match(videoTagsContainerRegex)
      console.log('=== TESTING TAGS CONTAINER ===')
      console.log('Video tags container found:', !!videoTagsMatch)
      if (videoTagsMatch) {
        console.log('Tags container sample:', videoTagsMatch[1].substring(0, 500))
      }

      console.log('=== END XHAMSTER DEBUG TEST ===')

      return {
        success: true,
        url,
        status: response.status,
        htmlLength: html.length,
        htmlSample: htmlSample,
        hasVideoTagsContainer: !!videoTagsMatch,
        debug: 'Check server logs for detailed pattern matching results'
      }

    } catch (error) {
      console.error('XHamster debug test error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to test XHamster URL')
    }
  })
}, {
  methods: ['POST'],
  requireAuth: true
})