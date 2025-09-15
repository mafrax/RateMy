#!/usr/bin/env node

/**
 * Test script to fetch real trending RedGifs with direct video URLs
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

class RedGifsRealTester {
  constructor() {
    this.BASE_URL = 'https://api.redgifs.com/v2'
    this.token = null
    this.tokenExpiry = 0
  }

  async getToken() {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    try {
      console.log('🔑 Getting RedGifs API token...')
      
      const response = await fetch(`${this.BASE_URL}/auth/temporary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get RedGifs token: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.token) {
        throw new Error('No token returned from RedGifs API')
      }

      this.token = data.token
      this.tokenExpiry = Date.now() + (60 * 60 * 1000)
      
      console.log('✅ Successfully obtained RedGifs API token')
      return this.token
    } catch (error) {
      console.error('❌ Failed to get RedGifs token:', error.message)
      throw error
    }
  }

  async getTrendingReal() {
    try {
      const token = await this.getToken()
      
      console.log('🔥 Fetching real trending RedGifs...')
      
      const response = await fetch(`${this.BASE_URL}/gifs/trending?count=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`RedGifs API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ Found ${data.gifs?.length || 0} real trending gifs`)
      
      return data.gifs || []
    } catch (error) {
      console.error('❌ Failed to fetch trending gifs:', error.message)
      return []
    }
  }

  async authenticateUser(email, password) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
        }
      })

      if (!user || !user.password) {
        throw new Error('User not found')
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

  async uploadRealTrendingGif(gif) {
    console.log(`📤 Uploading: ${gif.title || gif.id}`)
    console.log(`   ID: ${gif.id}`)
    console.log(`   HD URL: ${gif.urls?.hd || 'N/A'}`)
    console.log(`   SD URL: ${gif.urls?.sd || 'N/A'}`)
    console.log(`   Poster: ${gif.urls?.poster || 'N/A'}`)

    try {
      // Use the best available video URL (HD > SD > fallback)
      const embedUrl = gif.urls?.hd || gif.urls?.sd || `https://www.redgifs.com/ifr/${gif.id}?poster=0`
      
      const video = await prisma.video.create({
        data: {
          title: gif.title || `RedGif ${gif.id}`,
          originalUrl: `https://www.redgifs.com/watch/${gif.id}`,
          embedUrl: embedUrl,
          thumbnail: gif.urls?.poster || `https://thumbs4.redgifs.com/${gif.id}-poster.jpg`,
          description: gif.description || 'Trending RedGif content from API',
          isNsfw: true,
          userId: this.user.id,
        }
      })

      // Add tags
      if (gif.tags && gif.tags.length > 0) {
        for (const tagName of gif.tags.slice(0, 5)) { // Limit to 5 tags
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
            console.log(`⚠️  Failed to add tag ${tagName}:`, tagError.message)
          }
        }
      }

      console.log(`✅ Successfully uploaded: ${video.title} (${video.id})`)
      return video
    } catch (error) {
      console.error(`❌ Failed to upload ${gif.id}:`, error.message)
      return null
    }
  }

  async run(email, password) {
    console.log('🚀 Starting REAL RedGifs trending upload test')
    console.log('==========================================')

    // Authenticate user
    const authenticated = await this.authenticateUser(email, password)
    if (!authenticated) {
      process.exit(1)
    }

    // Fetch real trending gifs
    const trendingGifs = await this.getTrendingReal()
    if (!trendingGifs.length) {
      console.log('❌ No trending gifs found')
      process.exit(1)
    }

    console.log('==========================================')
    console.log(`📊 Processing ${trendingGifs.length} real trending gifs`)

    let uploaded = 0
    let errors = 0

    for (const gif of trendingGifs.slice(0, 3)) { // Limit to 3 for testing
      const result = await this.uploadRealTrendingGif(gif)
      if (result) {
        uploaded++
      } else {
        errors++
      }
      
      // Delay between uploads
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('==========================================')
    console.log('📋 Upload Summary:')
    console.log(`✅ Uploaded: ${uploaded} videos`)
    console.log(`❌ Errors: ${errors} videos`)

    await prisma.$disconnect()
    console.log('🏁 Real trending upload test completed!')
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: node scripts/test-redgifs-real.js <email> <password>')
    process.exit(1)
  }

  const [email, password] = args
  const tester = new RedGifsRealTester()
  
  try {
    await tester.run(email, password)
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}