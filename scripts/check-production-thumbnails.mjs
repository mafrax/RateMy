import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkProductionThumbnails() {
  console.log('🔍 Checking production database thumbnails directly...\n')

  try {
    await prisma.$connect()

    // Get raw video data from production database
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        originalUrl: true,
        thumbnail: true,
        previewUrl: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Found ${videos.length} videos in production database\n`)

    videos.forEach((video, index) => {
      const platform = video.originalUrl?.includes('redgifs.com') ? 'RedGifs' :
                      video.originalUrl?.includes('pornhub.com') ? 'Pornhub' :
                      video.originalUrl?.includes('xhamster.com') ? 'XHamster' :
                      video.originalUrl?.includes('youtube.com') ? 'YouTube' : 'Other'
                      
      console.log(`${index + 1}. [${platform}] ${video.title?.slice(0, 40)}...`)
      console.log(`   ID: ${video.id}`)
      console.log(`   Thumbnail: ${video.thumbnail ? '✅ ' + video.thumbnail.slice(0, 100) + '...' : '❌ null'}`)
      console.log(`   Preview: ${video.previewUrl ? '✅ ' + video.previewUrl.slice(0, 100) + '...' : '❌ null'}`)
      console.log()
    })

    // Get summary stats
    const stats = await prisma.video.groupBy({
      by: [],
      _count: {
        _all: true,
        thumbnail: true,
        previewUrl: true
      }
    })

    console.log('📊 Database Statistics:')
    console.log(`- Total videos: ${stats[0]._count._all}`)
    console.log(`- Videos with thumbnails: ${stats[0]._count.thumbnail}`)
    console.log(`- Videos with preview URLs: ${stats[0]._count.previewUrl}`)
    console.log(`- Thumbnail coverage: ${Math.round((stats[0]._count.thumbnail / stats[0]._count._all) * 100)}%`)

  } catch (error) {
    console.error('❌ Failed to check production thumbnails:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductionThumbnails()