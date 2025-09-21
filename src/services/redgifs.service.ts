import { logger } from '@/lib/logger'
import { ValidationError, APIError } from '@/lib/errors'

export interface RedGifMetadata {
  id: string
  title: string
  description?: string
  tags: string[]
  duration: number
  width: number
  height: number
  urls: {
    hd: string
    sd: string
    poster: string
  }
  views: number
  likes: number
  userName: string
  createDate: number
  type: number
  avgColor: string
}

export interface RedGifSearchResult {
  gifs: RedGifMetadata[]
  total: number
  page: number
}

class RedGifsService {
  private readonly BASE_URL = 'https://api.redgifs.com/v2'
  private token: string | null = null
  private tokenExpiry: number = 0

  /**
   * Get temporary token for API access
   */
  private async getToken(): Promise<string> {
    // Check if current token is still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    try {
      logger.info('Requesting new RedGifs API token')
      
      const response = await fetch(`${this.BASE_URL}/auth/temporary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new APIError(`Failed to get RedGifs token: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.token) {
        throw new APIError('No token returned from RedGifs API')
      }

      this.token = data.token
      // Set expiry to 1 hour from now (tokens typically last 24h but we refresh early)
      this.tokenExpiry = Date.now() + (60 * 60 * 1000)
      
      logger.info('Successfully obtained RedGifs API token')
      return this.token
    } catch (error) {
      logger.error('Failed to get RedGifs token', { error })
      throw new APIError('Failed to authenticate with RedGifs API')
    }
  }

  /**
   * Make authenticated request to RedGifs API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken()
    
    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('RedGifs API error', { 
        endpoint, 
        status: response.status, 
        error: errorText 
      })
      throw new APIError(`RedGifs API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Extract RedGifs ID from URL
   */
  public extractGifId(url: string): string {
    const patterns = [
      /redgifs\.com\/watch\/([a-zA-Z0-9]+)/,
      /redgifs\.com\/ifr\/([a-zA-Z0-9]+)/,
      /redgifs\.com\/([a-zA-Z0-9]+)$/,
      /\/([a-zA-Z0-9]+)$/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1].toLowerCase()
      }
    }

    throw new ValidationError('Invalid RedGifs URL format')
  }

  /**
   * Check if URL is a RedGifs URL
   */
  public isRedGifsUrl(url: string): boolean {
    return url.includes('redgifs.com') || url.includes('redgifs.com')
  }

  /**
   * Get metadata for a specific gif by ID
   */
  public async getGifMetadata(gifId: string): Promise<RedGifMetadata> {
    try {
      logger.info('Fetching RedGifs metadata', { gifId })
      
      const response = await this.makeRequest<{ gif: RedGifMetadata }>(`/gifs/${gifId}`)
      
      if (!response.gif) {
        throw new ValidationError('Gif not found')
      }

      logger.info('Successfully fetched RedGifs metadata', { 
        gifId, 
        title: response.gif.title,
        tags: response.gif.tags?.length || 0
      })

      return response.gif
    } catch (error) {
      logger.error('Failed to fetch RedGifs metadata', { gifId, error })
      throw error
    }
  }

  /**
   * Get metadata from RedGifs URL
   */
  public async getMetadataFromUrl(url: string): Promise<RedGifMetadata> {
    if (!this.isRedGifsUrl(url)) {
      throw new ValidationError('URL is not a RedGifs URL')
    }

    const gifId = this.extractGifId(url)
    return this.getGifMetadata(gifId)
  }

  /**
   * Convert RedGifs URL to embed format
   * Returns the iframe URL that shows just the gif without the full website interface
   */
  public getEmbedUrl(gifId: string): string {
    // Use the iframe URL that shows only the gif content
    return `https://www.redgifs.com/ifr/${gifId}?poster=0`
  }

  /**
   * Get direct gif URL from metadata
   */
  public getDirectGifUrl(metadata: RedGifMetadata): string {
    // Return the HD URL if available, otherwise SD, otherwise fallback to embed
    return metadata.urls?.hd || metadata.urls?.sd || this.getEmbedUrl(metadata.id)
  }

  /**
   * Get thumbnail URL for a gif
   */
  public getThumbnailUrl(gifId: string): string {
    return `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
  }

  /**
   * Search for gifs by tags or query
   */
  public async searchGifs(query: string, options: {
    page?: number
    count?: number
    order?: 'trending' | 'latest' | 'top'
  } = {}): Promise<RedGifSearchResult> {
    try {
      const { page = 1, count = 20, order = 'trending' } = options
      
      const params = new URLSearchParams({
        search_text: query,
        order,
        count: count.toString(),
        page: page.toString(),
      })

      logger.info('Searching RedGifs', { query, options })
      
      const response = await this.makeRequest<{
        gifs: RedGifMetadata[]
        total: number
        page: number
      }>(`/gifs/search?${params}`)

      logger.info('RedGifs search completed', { 
        query, 
        results: response.gifs?.length || 0,
        total: response.total 
      })

      return {
        gifs: response.gifs || [],
        total: response.total || 0,
        page: response.page || page,
      }
    } catch (error) {
      logger.error('Failed to search RedGifs', { query, options, error })
      throw error
    }
  }

  /**
   * Get trending gifs
   */
  public async getTrendingGifs(count: number = 10): Promise<RedGifMetadata[]> {
    try {
      logger.info('Fetching trending RedGifs', { count })
      
      const response = await this.makeRequest<{ gifs: RedGifMetadata[] }>(`/gifs/trending?count=${count}`)
      
      logger.info('Successfully fetched trending gifs', { 
        count: response.gifs?.length || 0 
      })

      return response.gifs || []
    } catch (error) {
      logger.error('Failed to fetch trending gifs', { count, error })
      throw error
    }
  }

  /**
   * Validate and process RedGifs URL for upload
   */
  public async processRedGifsUrl(url: string): Promise<{
    embedUrl: string
    thumbnail: string
    metadata: RedGifMetadata
    tags: string[]
  }> {
    try {
      const metadata = await this.getMetadataFromUrl(url)
      const gifId = this.extractGifId(url)

      // Use direct gif URL for better embedding experience
      const embedUrl = this.getDirectGifUrl(metadata)

      return {
        embedUrl,
        thumbnail: this.getThumbnailUrl(gifId),
        metadata,
        tags: metadata.tags || []
      }
    } catch (error) {
      logger.error('Failed to process RedGifs URL', { url, error })
      throw error
    }
  }
}

export const redGifsService = new RedGifsService()