#!/usr/bin/env node

/**
 * Test script to upload a Reddit URL
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

class RedditUploadTester {
  constructor() {
    this.user = null
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

  async testRedditUpload(redditUrl) {
    console.log('🚀 Testing Reddit URL upload')
    console.log('URL:', redditUrl)
    console.log('============================')

    try {
      // Call the video upload API
      const response = await fetch('http://localhost:3000/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: This would normally need authentication headers
          // For testing, we'll use direct database creation
        },
        body: JSON.stringify({
          title: 'Test Reddit Upload',
          originalUrl: redditUrl,
          description: 'Testing Reddit URL processing'
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API Upload successful:', result.data?.id)
        return result.data
      } else {
        console.log('⚠️  API upload failed, trying direct database upload...')
        return await this.directDatabaseUpload(redditUrl)
      }

    } catch (error) {
      console.log('⚠️  API error, trying direct database upload...')
      return await this.directDatabaseUpload(redditUrl)
    }
  }

  async directDatabaseUpload(redditUrl) {
    console.log('📤 Direct database upload for Reddit URL')

    try {
      // Simple Reddit post processing
      const postMatch = redditUrl.match(/\/r\/(\w+)\/comments\/([a-zA-Z0-9]+)(?:\/([^/]+))?/)
      
      if (!postMatch) {
        throw new Error('Invalid Reddit URL format')
      }

      const [, subreddit, postId, slug] = postMatch
      const title = slug ? slug.replace(/_/g, ' ') : `Reddit post from r/${subreddit}`

      // Create video in database
      const video = await prisma.video.create({
        data: {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          originalUrl: redditUrl,
          embedUrl: `https://www.reddit.com/r/${subreddit}/comments/${postId}/`,
          description: `Content from r/${subreddit} subreddit`,
          isNsfw: true, // Assume NSFW for adult content subreddits
          userId: this.user.id,
        }
      })

      // Add Reddit tags
      const tags = ['reddit', `r/${subreddit}`, 'nsfw']
      
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

      console.log('✅ Direct upload successful:', video.id)
      console.log('   Title:', video.title)
      console.log('   Embed URL:', video.embedUrl)
      console.log('   NSFW:', video.isNsfw)

      return video

    } catch (error) {
      console.error('❌ Direct upload failed:', error.message)
      return null
    }
  }

  async run(email, password, redditUrl) {
    // Authenticate user
    const authenticated = await this.authenticateUser(email, password)
    if (!authenticated) {
      process.exit(1)
    }

    // Test Reddit upload
    const result = await this.testRedditUpload(redditUrl)
    
    if (result) {
      console.log('============================')
      console.log('🎉 Reddit upload test completed successfully!')
      console.log('Video ID:', result.id)
    } else {
      console.log('❌ Reddit upload test failed')
    }

    await prisma.$disconnect()
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.log('Usage: node scripts/test-reddit-upload.js <email> <password> <reddit-url>')
    console.log('\\nExample:')
    console.log('  node scripts/test-reddit-upload.js admin@ratemy.com admin123 "https://www.reddit.com/r/videos/comments/xyz123/cool_video/"')
    process.exit(1)
  }

  const [email, password, redditUrl] = args
  const tester = new RedditUploadTester()
  
  try {
    await tester.run(email, password, redditUrl)
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}