#!/usr/bin/env node

/**
 * Fix the Reddit video by extracting the actual RedGifs URL
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixRedditVideo() {
  console.log('🔧 Fixing Reddit video...')

  try {
    // Get the Reddit video
    const video = await prisma.video.findUnique({
      where: { id: 'cmfgkemds0001xd7ret43l032' }
    })

    if (!video) {
      console.log('❌ Reddit video not found')
      return
    }

    console.log('📺 Found Reddit video:', video.title)

    // Get the actual content from Reddit API
    const response = await fetch('https://www.reddit.com/r/HugeDickTinyChick/comments/1ne9m9z.json', {
      headers: {
        'User-Agent': 'RateMy Video Platform/1.0',
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Reddit data')
    }

    const data = await response.json()
    const postData = data[0].data.children[0].data

    console.log('📄 Reddit post data:')
    console.log('   Title:', postData.title)
    console.log('   Domain:', postData.domain)
    console.log('   URL:', postData.url)

    if (postData.url && postData.url.includes('redgifs.com')) {
      console.log('✅ Found RedGifs URL in Reddit post')
      
      // Extract the RedGifs ID
      const redgifsMatch = postData.url.match(/redgifs\.com\/watch\/([a-zA-Z0-9]+)/)
      if (redgifsMatch) {
        const gifId = redgifsMatch[1]
        const properGifId = gifId.charAt(0).toUpperCase() + gifId.slice(1).toLowerCase()
        const directVideoUrl = `https://media.redgifs.com/${properGifId}.mp4`
        
        console.log('🎯 RedGifs ID:', gifId)
        console.log('🎬 Direct video URL:', directVideoUrl)

        // Test if the direct URL works
        const testResponse = await fetch(directVideoUrl, { method: 'HEAD' })
        console.log('🧪 Direct URL test:', testResponse.ok ? 'WORKING' : 'FAILED')

        if (testResponse.ok) {
          // Update the video with the working URL
          const updatedVideo = await prisma.video.update({
            where: { id: video.id },
            data: {
              embedUrl: directVideoUrl,
              thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`,
              description: `Reddit post from r/${postData.subreddit}: ${postData.title}`
            }
          })

          console.log('✅ Updated video with direct RedGifs URL')
          console.log('   New embed URL:', updatedVideo.embedUrl)
        } else {
          // Try iframe fallback
          const iframeUrl = `https://www.redgifs.com/ifr/${gifId}?poster=0`
          
          const updatedVideo = await prisma.video.update({
            where: { id: video.id },
            data: {
              embedUrl: iframeUrl,
              thumbnail: `https://thumbs4.redgifs.com/${gifId}-poster.jpg`,
              description: `Reddit post from r/${postData.subreddit}: ${postData.title}`
            }
          })

          console.log('✅ Updated video with iframe fallback URL')
          console.log('   New embed URL:', updatedVideo.embedUrl)
        }
      }
    } else {
      console.log('⚠️  No RedGifs URL found in Reddit post')
    }

  } catch (error) {
    console.error('❌ Failed to fix Reddit video:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixRedditVideo()