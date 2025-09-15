#!/usr/bin/env node

/**
 * Script to upload trending RedGifs to RateMy platform
 * 
 * Usage:
 *   node scripts/upload-trending-redgifs.js <email> <password>
 * 
 * Example:
 *   node scripts/upload-trending-redgifs.js admin@ratemy.com mypassword123
 * 
 * This script will:
 * 1. Authenticate with the provided user credentials
 * 2. Fetch the 10 most trending gifs from RedGifs API
 * 3. Upload each gif to the RateMy platform
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
// Node.js 18+ has built-in fetch

const prisma = new PrismaClient()
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

class TrendingRedGifsUploader {
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

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user
      this.user = userWithoutPassword
      
      console.log('✅ Authentication successful for:', user.username)
      return true
    } catch (error) {
      console.error('❌ Authentication failed:', error.message)
      return false
    }
  }

  async fetchTrendingRedGifs() {
    console.log('🔥 Fetching trending RedGifs...')
    
    try {
      // Simulate the RedGifs API call (using internal service logic)
      const response = await fetch(`${BASE_URL}/api/debug/redgifs-trending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        // If no debug endpoint, we'll create a simple trending list
        console.log('📝 Using fallback trending list (debug endpoint not found)')
        return this.getFallbackTrendingList()
      }

      const data = await response.json()
      const gifs = data.success ? data.data?.gifs || [] : []
      console.log(`✅ Found ${gifs.length} trending gifs`)
      return gifs
    } catch (error) {
      console.log('📝 Using fallback trending list due to API error:', error.message)
      return this.getFallbackTrendingList()
    }
  }

  getFallbackTrendingList() {
    // Popular RedGifs IDs for testing (these are public, safe examples)
    return [
      'https://www.redgifs.com/watch/admiringcalmgreyhounddog',
      'https://www.redgifs.com/watch/anchoredimpolitedeer', 
      'https://www.redgifs.com/watch/angrylivearmedcrab',
      'https://www.redgifs.com/watch/alertnegligibleant',
      'https://www.redgifs.com/watch/adorablequerulousamericanratsnake',
      'https://www.redgifs.com/watch/ancientdarkblueibis',
      'https://www.redgifs.com/watch/angryalikedormouse',
      'https://www.redgifs.com/watch/altruisticfreshcottonmouth',
      'https://www.redgifs.com/watch/aggravatingmajoreel',
      'https://www.redgifs.com/watch/anchoredmediocrecrow'
    ].map(url => ({
      id: this.extractGifIdFromUrl(url),
      title: `Trending RedGif`,
      description: 'Automatically uploaded trending content',
      tags: ['trending', 'redgifs', 'popular'],
      originalUrl: url
    }))
  }

  extractGifIdFromUrl(url) {
    const match = url.match(/\/watch\/([a-zA-Z0-9]+)/)
    return match ? match[1] : 'unknown'
  }

  async processRedGifsUrl(url) {
    try {
      console.log(`🔍 Processing RedGifs URL: ${url}`)
      
      // Call the RedGifs processing API endpoint
      const response = await fetch(`${BASE_URL}/api/debug/process-redgifs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
      
      // Fallback processing
      const gifId = this.extractGifIdFromUrl(url)
      return {
        embedUrl: `https://www.redgifs.com/ifr/${gifId}?poster=0`,
        thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
      }
    } catch (error) {
      console.log(`⚠️  Failed to process RedGifs URL, using fallback: ${error.message}`)
      const gifId = this.extractGifIdFromUrl(url)
      return {
        embedUrl: `https://www.redgifs.com/ifr/${gifId}?poster=0`,
        thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
      }
    }
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

  async uploadVideo(gifData) {
    const { originalUrl, title, description, tags } = gifData

    // Check if video already exists
    const existing = await this.checkIfVideoExists(originalUrl)
    if (existing) {
      console.log(`⏭️  Skipping existing video: ${title} (${existing.id})`)
      this.skippedCount++
      return null
    }

    console.log(`📤 Uploading: ${title}`)
    console.log(`   URL: ${originalUrl}`)

    try {
      // Make API call to upload video
      const response = await fetch(`${BASE_URL}/api/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real implementation, you'd need to handle NextAuth sessions
          // For now, we'll directly call the video service
        },
        body: JSON.stringify({
          title,
          originalUrl,
          description,
          tags: tags || []
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ Successfully uploaded: ${result.data?.title || title}`)
      this.uploadedCount++
      
      return result.data
    } catch (error) {
      console.error(`❌ Failed to upload ${title}:`, error.message)
      this.errors.push({ title, error: error.message })
      return null
    }
  }

  async uploadDirectToDatabase(gifData) {
    // Direct database upload as fallback
    const { originalUrl, title, description, tags } = gifData

    try {
      console.log(`📤 Direct DB upload: ${title}`)

      // Use the video service to properly process RedGifs URL
      const processedData = await this.processRedGifsUrl(originalUrl)

      // Create video directly in database
      const video = await prisma.video.create({
        data: {
          title,
          originalUrl,
          embedUrl: processedData.embedUrl, // Use proper processed embed URL
          thumbnail: processedData.thumbnail,
          description,
          isNsfw: true, // All RedGifs are NSFW
          userId: this.user.id,
        }
      })

      // Add tags if provided
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Create or find tag
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {}
          })

          // Link tag to video
          await prisma.videoTag.create({
            data: {
              videoId: video.id,
              tagId: tag.id
            }
          })
        }
      }

      console.log(`✅ Direct DB upload successful: ${video.title} (${video.id})`)
      this.uploadedCount++
      return video
    } catch (error) {
      console.error(`❌ Direct DB upload failed for ${title}:`, error.message)
      this.errors.push({ title, error: error.message })
      return null
    }
  }

  async run(email, password) {
    console.log('🚀 Starting RedGifs trending uploader')
    console.log('==================================')

    // Authenticate user
    const authenticated = await this.authenticateUser(email, password)
    if (!authenticated) {
      process.exit(1)
    }

    // Fetch trending gifs
    const trendingGifs = await this.fetchTrendingRedGifs()
    if (!trendingGifs.length) {
      console.log('❌ No trending gifs found')
      process.exit(1)
    }

    console.log(`📊 Processing ${trendingGifs.length} trending gifs`)
    console.log('==================================')

    // Upload each gif
    for (const gif of trendingGifs.slice(0, 10)) { // Limit to 10
      try {
        // Try API upload first, fallback to direct DB
        let result = await this.uploadVideo(gif)
        
        if (!result) {
          console.log('🔄 Attempting direct database upload...')
          result = await this.uploadDirectToDatabase(gif)
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`❌ Unexpected error processing ${gif.title}:`, error.message)
        this.errors.push({ title: gif.title, error: error.message })
      }
    }

    // Report results
    console.log('==================================')
    console.log('📋 Upload Summary:')
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
    console.log('\n🏁 Upload process completed!')
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: node scripts/upload-trending-redgifs.js <email> <password>')
    console.log('\nExample:')
    console.log('  node scripts/upload-trending-redgifs.js admin@ratemy.com mypassword123')
    process.exit(1)
  }

  const [email, password] = args
  const uploader = new TrendingRedGifsUploader()
  
  try {
    await uploader.run(email, password)
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = TrendingRedGifsUploader