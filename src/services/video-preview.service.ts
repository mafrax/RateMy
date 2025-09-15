/**
 * Service for extracting video preview URLs from various video platforms
 */

export interface VideoPreviewData {
  previewUrl?: string
  thumbnailUrl?: string
}

/**
 * Extract preview video URL from XHamster video page
 */
export async function extractXHamsterPreview(originalUrl: string, videoId?: string): Promise<VideoPreviewData> {
  try {
    console.log('🌐 Service called with URL:', originalUrl)
    
    // Only process XHamster URLs
    if (!originalUrl.includes('xhamster.com')) {
      console.log('🌐 Not an XHamster URL, returning empty')
      return {}
    }

    console.log('🌐 Calling API endpoint...')
    const response = await fetch('/api/video-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: originalUrl, videoId })
    })

    console.log('🌐 API response status:', response.status)
    
    if (!response.ok) {
      console.warn('🌐 Failed to fetch video preview data:', response.statusText)
      const errorText = await response.text()
      console.warn('🌐 Error response:', errorText)
      return {}
    }

    const data = await response.json()
    console.log('🌐 API response data:', data)
    
    return {
      previewUrl: data.previewUrl,
      thumbnailUrl: data.thumbnailUrl
    }
  } catch (error) {
    console.error('🌐 Error extracting XHamster preview:', error)
    return {}
  }
}

/**
 * Extract video ID from XHamster URL to construct preview URL pattern
 */
export function extractXHamsterVideoId(url: string): string | null {
  try {
    // Pattern: https://fra.xhamster.com/videos/title-number-videoId
    const match = url.match(/xhamster\.com\/videos\/.*-(\d+)$/)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting video ID from URL:', error)
    return null
  }
}