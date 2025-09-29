import { PrismaClient } from '@prisma/client'

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkVideoThumbnails() {
  console.log('🔍 Checking video thumbnails across all platforms...\n')

  try {
    await prodPrisma.$connect()

    // Get videos by platform
    const videos = await prodPrisma.video.findMany({
      select: {
        id: true,
        title: true,
        originalUrl: true,
        thumbnail: true,
        previewUrl: true
      },
      take: 50
    })

    console.log(`📊 Found ${videos.length} videos total\n`)

    // Group by platform
    const platforms = {
      redgifs: videos.filter(v => v.originalUrl?.includes('redgifs.com')),
      pornhub: videos.filter(v => v.originalUrl?.includes('pornhub.com')),
      xhamster: videos.filter(v => v.originalUrl?.includes('xhamster.com')),
      youtube: videos.filter(v => v.originalUrl?.includes('youtube.com') || v.originalUrl?.includes('youtu.be')),
      other: videos.filter(v => 
        !v.originalUrl?.includes('redgifs.com') &&
        !v.originalUrl?.includes('pornhub.com') &&
        !v.originalUrl?.includes('xhamster.com') &&
        !v.originalUrl?.includes('youtube.com') &&
        !v.originalUrl?.includes('youtu.be')
      )
    }

    for (const [platformName, platformVideos] of Object.entries(platforms)) {
      if (platformVideos.length === 0) continue
      
      console.log(`\n📺 ${platformName.toUpperCase()} (${platformVideos.length} videos)`)
      console.log('=' .repeat(50))
      
      let hasThumb = 0
      let hasPreview = 0
      
      platformVideos.slice(0, 5).forEach((video, i) => {
        console.log(`\n${i + 1}. ${video.title.slice(0, 40)}...`)
        console.log(`   URL: ${video.originalUrl}`)
        console.log(`   Thumbnail: ${video.thumbnail ? '✅ ' + video.thumbnail.slice(0, 60) + '...' : '❌ None'}`)
        console.log(`   Preview: ${video.previewUrl ? '✅ ' + video.previewUrl.slice(0, 60) + '...' : '❌ None'}`)
        
        if (video.thumbnail) hasThumb++
        if (video.previewUrl) hasPreview++
      })
      
      console.log(`\n📊 ${platformName} Summary:`)
      console.log(`   Thumbnails: ${hasThumb}/${Math.min(5, platformVideos.length)} shown (${Math.round((platformVideos.filter(v => v.thumbnail).length / platformVideos.length) * 100)}% total)`)
      console.log(`   Previews: ${hasPreview}/${Math.min(5, platformVideos.length)} shown (${Math.round((platformVideos.filter(v => v.previewUrl).length / platformVideos.length) * 100)}% total)`)
    }

  } catch (error) {
    console.error('❌ Failed to check video thumbnails:', error)
  } finally {
    await prodPrisma.$disconnect()
  }
}

checkVideoThumbnails()