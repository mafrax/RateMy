#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixRedGifsUrls() {
  console.log('🔍 Starting RedGifs URL migration...')
  
  try {
    // Find all videos with RedGifs URLs that need fixing
    const videos = await prisma.video.findMany({
      where: {
        OR: [
          {
            // Original URL is RedGifs but embed URL is still /watch/ format
            originalUrl: { contains: 'redgifs.com' },
            embedUrl: { contains: '/watch/' }
          },
          {
            // Original URL is RedGifs but embed URL doesn't contain /ifr/
            originalUrl: { contains: 'redgifs.com' },
            NOT: {
              embedUrl: { contains: '/ifr/' }
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        originalUrl: true,
        embedUrl: true
      }
    })

    if (videos.length === 0) {
      console.log('✅ No RedGifs URLs need fixing!')
      return
    }

    console.log(`📝 Found ${videos.length} videos with RedGifs URLs that need fixing:`)
    
    let fixedCount = 0
    let errorCount = 0

    for (const video of videos) {
      try {
        console.log(`\n🔧 Processing: ${video.title}`)
        console.log(`   Original URL: ${video.originalUrl}`)
        console.log(`   Current Embed URL: ${video.embedUrl}`)

        // Extract the video ID from the original URL
        const redgifsRegex = /(?:https?:\/\/)?(?:www\.)?redgifs\.com\/watch\/([a-zA-Z0-9]+)/i
        const match = video.originalUrl.match(redgifsRegex)
        
        if (!match) {
          console.log(`   ⚠️  Could not extract video ID from URL: ${video.originalUrl}`)
          errorCount++
          continue
        }

        const videoId = match[1]
        const correctEmbedUrl = `https://www.redgifs.com/ifr/${videoId}`
        
        console.log(`   New Embed URL: ${correctEmbedUrl}`)

        // Update the video
        await prisma.video.update({
          where: { id: video.id },
          data: { embedUrl: correctEmbedUrl }
        })

        console.log(`   ✅ Updated successfully!`)
        fixedCount++

      } catch (error) {
        console.log(`   ❌ Error updating video ${video.id}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Fixed: ${fixedCount} videos`)
    console.log(`   ❌ Errors: ${errorCount} videos`)
    console.log(`   📝 Total processed: ${videos.length} videos`)

    if (fixedCount > 0) {
      console.log(`\n🎉 Successfully migrated ${fixedCount} RedGifs URLs!`)
    }

  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Add a test function to verify the conversion logic
async function testUrlConversion() {
  console.log('🧪 Testing URL conversion logic...')
  
  const testUrls = [
    'https://www.redgifs.com/watch/gracefulcleargiraffe',
    'https://redgifs.com/watch/examplevideoname',
    'http://www.redgifs.com/watch/anothervideo',
    'www.redgifs.com/watch/testvideo'
  ]

  testUrls.forEach(url => {
    const redgifsRegex = /(?:https?:\/\/)?(?:www\.)?redgifs\.com\/watch\/([a-zA-Z0-9]+)/i
    const match = url.match(redgifsRegex)
    
    if (match) {
      const videoId = match[1]
      const embedUrl = `https://www.redgifs.com/ifr/${videoId}`
      console.log(`✅ ${url} → ${embedUrl}`)
    } else {
      console.log(`❌ Failed to parse: ${url}`)
    }
  })
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--test')) {
    await testUrlConversion()
    return
  }

  if (args.includes('--dry-run')) {
    console.log('🔍 DRY RUN MODE - No changes will be made')
    
    const videos = await prisma.video.findMany({
      where: {
        OR: [
          {
            originalUrl: { contains: 'redgifs.com' },
            embedUrl: { contains: '/watch/' }
          },
          {
            originalUrl: { contains: 'redgifs.com' },
            NOT: {
              embedUrl: { contains: '/ifr/' }
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        originalUrl: true,
        embedUrl: true
      }
    })

    if (videos.length === 0) {
      console.log('✅ No RedGifs URLs need fixing!')
    } else {
      console.log(`📝 Found ${videos.length} videos that would be updated:`)
      videos.forEach(video => {
        const redgifsRegex = /(?:https?:\/\/)?(?:www\.)?redgifs\.com\/watch\/([a-zA-Z0-9]+)/i
        const match = video.originalUrl.match(redgifsRegex)
        const newUrl = match ? `https://www.redgifs.com/ifr/${match[1]}` : 'Could not parse'
        
        console.log(`\n📹 ${video.title}`)
        console.log(`   Current: ${video.embedUrl}`)
        console.log(`   Would become: ${newUrl}`)
      })
    }
    
    await prisma.$disconnect()
    return
  }

  await fixRedGifsUrls()
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

module.exports = { fixRedGifsUrls, testUrlConversion }