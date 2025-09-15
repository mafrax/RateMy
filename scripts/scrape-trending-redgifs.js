#!/usr/bin/env node

/**
 * Script to scrape trending RedGifs from the homepage without API
 * 
 * Usage: node scripts/scrape-trending-redgifs.js <email> <password>
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

class RedGifsScraper {
  constructor() {
    this.user = null
    this.uploadedCount = 0
    this.skippedCount = 0
    this.errors = []
  }

  async authenticateUser(email, password) {
    console.log('🔐 Authenticating user:', email)
    
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          password: true,
        }
      })

      if (!user || !user.password) {
        throw new Error('User not found or invalid credentials')
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        throw new Error('Invalid password')
      }

      const { password: _, ...userWithoutPassword } = user
      this.user = userWithoutPassword
      
      console.log('✅ Authentication successful for:', user.username)
      return true
    } catch (error) {
      console.error('❌ Authentication failed:', error.message)
      return false
    }
  }

  async scrapeTrendingGifs() {
    console.log('🌐 Scraping RedGifs homepage for trending content...')
    
    try {
      const response = await fetch('https://www.redgifs.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch RedGifs homepage: ${response.status}`)
      }

      const html = await response.text()
      console.log('✅ Successfully fetched RedGifs homepage')
      
      return this.parseGifsFromHtml(html)
    } catch (error) {
      console.error('❌ Failed to scrape RedGifs homepage:', error.message)
      return []
    }
  }

  parseGifsFromHtml(html) {
    console.log('🔍 Parsing HTML for gif data...')
    
    const gifs = []
    
    try {
      // Look for different patterns that might contain gif data
      const patterns = [
        // Pattern 1: Look for RedGifs URLs in href attributes
        /href="https:\/\/www\.redgifs\.com\/watch\/([a-zA-Z0-9]+)"/g,
        // Pattern 2: Look for gif IDs in data attributes or scripts
        /\/watch\/([a-zA-Z0-9]+)/g,
        // Pattern 3: Look for direct references to gif IDs
        /"id":"([a-zA-Z0-9]+)"/g,
        // Pattern 4: Look for JSON data containing gif info
        /"gif":\s*{\s*"id":\s*"([a-zA-Z0-9]+)"/g,
        // Pattern 5: Look for gif IDs in JavaScript variables
        /gifId['":\s]*['"]([a-zA-Z0-9]+)['"]/g,
        // Pattern 6: Look for data-gif-id attributes
        /data-gif-id=['"]([a-zA-Z0-9]+)['"]/g,
        // Pattern 7: Look for any alphanumeric strings that look like gif IDs (15+ chars)
        /['"\/]([a-zA-Z0-9]{15,})['"\/]/g,
        // Pattern 8: Look for URLs with /watch/ in them
        /redgifs\.com\/watch\/([a-zA-Z0-9]+)/g
      ]

      const foundIds = new Set()

      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null && foundIds.size < 15) {
          const gifId = match[1]
          if (gifId && this.isValidGifId(gifId) && !foundIds.has(gifId)) {
            foundIds.add(gifId)
            
            // Generate title from gif ID (convert camelCase to readable text)
            const title = this.generateTitleFromId(gifId)
            
            gifs.push({
              id: gifId,
              title: title,
              originalUrl: `https://www.redgifs.com/watch/${gifId}`,
              description: `Trending RedGif: ${title}`,
              tags: ['trending', 'redgifs', 'scraped']
            })
          }
        }
      }

      // If no patterns worked, use some known working examples
      if (gifs.length === 0) {
        console.log('⚠️  No gifs found in HTML, using fallback examples')
        return this.getFallbackGifs()
      }

      console.log(`✅ Extracted ${gifs.length} gif IDs from homepage`)
      return gifs.slice(0, 10) // Return top 10
      
    } catch (error) {
      console.error('❌ Error parsing HTML:', error.message)
      return this.getFallbackGifs()
    }
  }

  isValidGifId(gifId) {
    // Filter out common false positives
    const invalidPatterns = [
      /^(DOMContentLoaded|addEventListener|querySelector|innerHTML|createElement)$/i,
      /^(function|window|document|console|alert|confirm)$/i,
      /^(true|false|null|undefined|return|break|continue)$/i,
      /^[0-9]{1,4}$/, // Too short numeric IDs
      /[<>{}()[\]]/,  // Contains HTML/JS characters
    ]

    if (gifId.length < 8 || gifId.length > 50) {
      return false
    }

    return !invalidPatterns.some(pattern => pattern.test(gifId))
  }

  generateTitleFromId(gifId) {
    // Convert camelCase gif ID to readable title
    // Example: "admiringcalmgreyhounddog" -> "Admiring Calm Greyhound Dog"
    return gifId
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/\s+/g, ' ') // Clean up spaces
      .trim()
  }

  getFallbackGifs() {
    // Use some known working RedGifs as fallback
    const fallbackIds = [
      'gracefulcleargiraffe',
      'adorablequerulousamericanratsnake',
      'ancientdarkblueibis',
      'angryalikedormouse',
      'altruisticfreshcottonmouth',
      'aggravatingmajoreel',
      'anchoredmediocrecrow',
      'alertnegligibleant',
      'admiringcalmgreyhounddog',
      'anchoredimpolitedeer'
    ]

    return fallbackIds.map(id => ({
      id,
      title: this.generateTitleFromId(id),
      originalUrl: `https://www.redgifs.com/watch/${id}`,
      description: `RedGif: ${this.generateTitleFromId(id)}`,
      tags: ['redgifs', 'fallback']
    }))
  }

  async checkIfVideoExists(originalUrl) {
    try {
      const existingVideo = await prisma.video.findFirst({
        where: { originalUrl },
        select: { id: true, title: true }
      })
      return existingVideo
    } catch (error) {
      console.error('Error checking existing video:', error.message)
      return null
    }
  }

  async processRedGifsUrl(originalUrl) {
    try {
      // Extract gif ID from URL
      const match = originalUrl.match(/\/watch\/([a-zA-Z0-9]+)/)
      if (!match) {
        throw new Error('Invalid RedGifs URL')
      }

      const gifId = match[1]
      
      // Try different URL formats for RedGifs videos
      const possibleEmbedUrls = [
        `https://media.redgifs.com/${this.capitalizeGifId(gifId)}.mp4`,
        `https://thumbs4.redgifs.com/${gifId}.mp4`,
        `https://www.redgifs.com/ifr/${gifId}?poster=0`,
        `https://www.redgifs.com/ifr/${gifId}`
      ]

      // Test which URL works
      for (const embedUrl of possibleEmbedUrls) {
        try {
          const testResponse = await fetch(embedUrl, { method: 'HEAD' })
          if (testResponse.ok) {
            console.log(`✅ Found working embed URL: ${embedUrl}`)
            return {
              embedUrl,
              thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
            }
          }
        } catch (e) {
          // Continue to next URL
        }
      }

      // Fallback to iframe embed
      return {
        embedUrl: `https://www.redgifs.com/ifr/${gifId}?poster=0`,
        thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
      }

    } catch (error) {
      console.log(`⚠️  Failed to process RedGifs URL: ${error.message}`)
      const match = originalUrl.match(/\/watch\/([a-zA-Z0-9]+)/)
      const gifId = match ? match[1] : 'unknown'
      
      return {
        embedUrl: `https://www.redgifs.com/ifr/${gifId}?poster=0`,
        thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
      }
    }
  }

  capitalizeGifId(gifId) {
    // Convert 'gracefulcleargiraffe' to 'GracefulClearGiraffe'
    return gifId.replace(/([a-z])([A-Z])/g, '$1$2')
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  async uploadGifToDatabase(gifData) {
    const { originalUrl, title, description, tags } = gifData

    // Check if video already exists
    const existing = await this.checkIfVideoExists(originalUrl)
    if (existing) {
      console.log(`⏭️  Skipping existing video: ${title}`)
      this.skippedCount++
      return null
    }

    console.log(`📤 Uploading: ${title}`)
    console.log(`   URL: ${originalUrl}`)

    try {
      // Process the RedGifs URL to get proper embed URL
      const processedData = await this.processRedGifsUrl(originalUrl)

      // Create video in database
      const video = await prisma.video.create({
        data: {
          title,
          originalUrl,
          embedUrl: processedData.embedUrl,
          thumbnail: processedData.thumbnail,
          description,
          isNsfw: true, // All RedGifs are NSFW
          userId: this.user.id,
        }
      })

      // Add tags
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          try {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              create: { name: tagName },
              update: {}
            })

            await prisma.videoTag.create({
              data: {
                videoId: video.id,
                tagId: tag.id
              }
            })
          } catch (tagError) {
            // Ignore tag errors
          }
        }
      }

      console.log(`✅ Successfully uploaded: ${video.title} (${video.id})`)
      console.log(`   Embed URL: ${processedData.embedUrl}`)
      this.uploadedCount++
      return video

    } catch (error) {
      console.error(`❌ Failed to upload ${title}:`, error.message)
      this.errors.push({ title, error: error.message })
      return null
    }
  }

  async run(email, password) {
    console.log('🚀 Starting RedGifs homepage scraper')
    console.log('===================================')

    // Authenticate user
    const authenticated = await this.authenticateUser(email, password)
    if (!authenticated) {
      process.exit(1)
    }

    // Scrape trending gifs from homepage
    const scrapedGifs = await this.scrapeTrendingGifs()
    if (!scrapedGifs.length) {
      console.log('❌ No gifs found')
      process.exit(1)
    }

    console.log('===================================')
    console.log(`📊 Processing ${scrapedGifs.length} scraped gifs`)

    // Upload each gif
    for (const gif of scrapedGifs) {
      try {
        await this.uploadGifToDatabase(gif)
        
        // Delay between uploads
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Unexpected error processing ${gif.title}:`, error.message)
        this.errors.push({ title: gif.title, error: error.message })
      }
    }

    // Report results
    console.log('===================================')
    console.log('📋 Scraping & Upload Summary:')
    console.log(`✅ Uploaded: ${this.uploadedCount} videos`)
    console.log(`⏭️  Skipped: ${this.skippedCount} videos (already exist)`)
    console.log(`❌ Errors: ${this.errors.length} videos`)

    if (this.errors.length > 0) {
      console.log('\n❌ Error Details:')
      this.errors.forEach(({ title, error }) => {
        console.log(`   - ${title}: ${error}`)
      })
    }

    await prisma.$disconnect()
    console.log('\n🏁 Scraping process completed!')
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: node scripts/scrape-trending-redgifs.js <email> <password>')
    console.log('\nExample:')
    console.log('  node scripts/scrape-trending-redgifs.js admin@ratemy.com admin123')
    process.exit(1)
  }

  const [email, password] = args
  const scraper = new RedGifsScraper()
  
  try {
    await scraper.run(email, password)
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = RedGifsScraper