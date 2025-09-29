import { PrismaClient } from '@prisma/client'
import { redGifsService } from '../src/services/redgifs.service'

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
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1].toLowerCase()
    }
  }
  
  throw new Error('Invalid RedGifs URL format')
}

async function updateRedGifsWithAPIUrls() {
  console.log('🔄 Updating RedGifs videos with API-provided URLs...\n')

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

    console.log(`📊 Found ${redgifsVideos.length} RedGifs videos to update\n`)

    let updated = 0
    let failed = 0

    for (const video of redgifsVideos) {
      try {
        const gifId = extractGifId(video.originalUrl)
        console.log(`🔄 Processing: ${video.title.slice(0, 40)} (${gifId})`)

        // Fetch metadata from RedGifs API
        const metadata = await redGifsService.getGifMetadata(gifId)
        
        let needsUpdate = false
        const updateData: any = {}

        // Check if we need to update thumbnail with API-provided URL
        if (metadata.urls?.poster && metadata.urls.poster !== video.thumbnail) {
          updateData.thumbnail = metadata.urls.poster
          needsUpdate = true
          console.log(`   📸 Updating thumbnail: ${metadata.urls.poster}`)
        }

        // Update embed URL to ensure it's correct
        const correctEmbedUrl = redGifsService.getEmbedUrl(gifId)
        if (correctEmbedUrl !== video.embedUrl) {
          updateData.embedUrl = correctEmbedUrl
          needsUpdate = true
          console.log(`   🎬 Updating embed URL: ${correctEmbedUrl}`)
        }

        if (needsUpdate) {
          await prodPrisma.video.update({
            where: { id: video.id },
            data: updateData
          })
          console.log(`   ✅ Updated successfully`)
          updated++
        } else {
          console.log(`   ✅ Already up to date`)
        }

        // Add a small delay to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        failed++
      }
    }

    console.log(`\n📊 Update Summary:`)
    console.log(`✅ Successfully updated: ${updated} videos`)
    console.log(`❌ Failed updates: ${failed} videos`)

    if (updated > 0) {
      console.log(`\n🎉 RedGifs videos now use API-provided URLs!`)
      console.log(`These should bypass hotlinking protection.`)
    }

  } catch (error) {
    console.error('❌ Failed to update RedGifs URLs:', error)
  } finally {
    await prodPrisma.$disconnect()
  }
}

updateRedGifsWithAPIUrls()