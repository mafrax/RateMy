import { PrismaClient } from '@prisma/client'

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkRedGifsUrls() {
  console.log('🔍 Checking RedGifs URLs in production database...\n')

  try {
    await prodPrisma.$connect()

    // Find all videos with RedGifs URLs
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

    console.log(`📊 Found ${redgifsVideos.length} RedGifs videos\n`)

    if (redgifsVideos.length === 0) {
      console.log('✅ No RedGifs videos found')
      return
    }

    let directUrls = 0
    let embedUrls = 0
    let watchUrls = 0

    console.log('🔍 Analyzing URL patterns:')
    redgifsVideos.forEach((video, index) => {
      const embedUrl = video.embedUrl
      const originalUrl = video.originalUrl

      console.log(`\n${index + 1}. "${video.title.slice(0, 40)}"`)
      console.log(`   Original: ${originalUrl}`)
      console.log(`   Embed: ${embedUrl}`)
      console.log(`   Thumbnail: ${video.thumbnail || 'null'}`)

      if (embedUrl?.includes('.mp4')) {
        directUrls++
        console.log(`   ❌ PROBLEM: Direct .mp4 URL (will be blocked by hotlinking protection)`)
      } else if (embedUrl?.includes('/ifr/')) {
        embedUrls++
        console.log(`   ✅ GOOD: Embed URL format`)
      } else if (embedUrl?.includes('/watch/')) {
        watchUrls++
        console.log(`   ⚠️  PROBLEM: Watch URL (not embeddable)`)
      } else {
        console.log(`   ❓ UNKNOWN: ${embedUrl}`)
      }
    })

    console.log(`\n📈 URL Summary:`)
    console.log(`- Direct .mp4 URLs (BROKEN): ${directUrls}`)
    console.log(`- /watch/ URLs (NOT EMBEDDABLE): ${watchUrls}`)
    console.log(`- Proper embed URLs: ${embedUrls}`)

    if (directUrls > 0 || watchUrls > 0) {
      console.log(`\n⚠️  ${directUrls + watchUrls} RedGifs videos need URL fixing!`)
      console.log(`\nProper RedGifs embed URL format should be:`)
      console.log(`https://redgifs.com/ifr/[GIF_ID]`)
    } else {
      console.log(`\n✅ All RedGifs URLs are properly formatted!`)
    }

  } catch (error) {
    console.error('❌ Error checking URLs:', error)
  } finally {
    await prodPrisma.$disconnect()
  }
}

checkRedGifsUrls()