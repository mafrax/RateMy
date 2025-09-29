import { PrismaClient } from '@prisma/client'

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

function extractGifId(url: string): string {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?redgifs\.com\/watch\/([a-zA-Z0-9]+)/i,
    /(?:https?:\/\/)?(?:www\.)?redgifs\.com\/ifr\/([a-zA-Z0-9]+)/i,
    /(?:https?:\/\/)?media\.redgifs\.com\/([a-zA-Z0-9]+)\.mp4/i
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1].toLowerCase()
    }
  }
  
  throw new Error('Invalid RedGifs URL format')
}

function getThumbnailUrl(gifId: string): string {
  // Try multiple thumbnail URL patterns as RedGifs CDN structure may vary
  return `https://thumbs4.redgifs.com/${gifId}-poster.jpg`
}

async function fixRedGifsThumbnails() {
  console.log('🖼️  Fixing RedGifs thumbnails...\n')

  try {
    await prodPrisma.$connect()

    // Find all RedGifs videos
    const redgifsVideos = await prodPrisma.video.findMany({
      where: {
        OR: [
          { originalUrl: { contains: 'redgifs.com' } },
          { embedUrl: { contains: 'redgifs.com' } }
        ]
      },
      select: {
        id: true,
        title: true,
        originalUrl: true,
        embedUrl: true,
        thumbnail: true
      }
    })

    console.log(`📊 Found ${redgifsVideos.length} RedGifs videos to process\n`)

    let updated = 0

    for (const video of redgifsVideos) {
      try {
        const gifId = extractGifId(video.originalUrl)
        const newThumbnailUrl = getThumbnailUrl(gifId)

        // Only update if thumbnail is missing or different
        if (!video.thumbnail || video.thumbnail !== newThumbnailUrl) {
          await prodPrisma.video.update({
            where: { id: video.id },
            data: { thumbnail: newThumbnailUrl }
          })

          console.log(`✅ Updated thumbnail for: ${video.title.slice(0, 40)}`)
          console.log(`   New thumbnail: ${newThumbnailUrl}`)
          updated++
        } else {
          console.log(`ℹ️  Thumbnail already correct: ${video.title.slice(0, 40)}`)
        }

      } catch (error) {
        console.log(`❌ Failed to process: ${video.title.slice(0, 40)}`)
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`\n🎉 Successfully updated ${updated} RedGifs thumbnails!`)

  } catch (error) {
    console.error('❌ Failed to fix thumbnails:', error)
  } finally {
    await prodPrisma.$disconnect()
  }
}

fixRedGifsThumbnails()