import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkDuplicateVideos() {
  console.log('🔍 Checking for duplicate videos in production database...\n')

  try {
    await prisma.$connect()

    // Find videos with the same originalUrl
    const duplicates = await prisma.video.groupBy({
      by: ['originalUrl'],
      having: {
        originalUrl: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        originalUrl: true
      },
      orderBy: {
        _count: {
          originalUrl: 'desc'
        }
      }
    })

    console.log(`📊 Found ${duplicates.length} URLs with duplicate videos\n`)

    for (const duplicate of duplicates.slice(0, 10)) {
      console.log(`🔄 URL: ${duplicate.originalUrl} (${duplicate._count.originalUrl} copies)`)
      
      // Get all versions of this video
      const versions = await prisma.video.findMany({
        where: {
          originalUrl: duplicate.originalUrl
        },
        select: {
          id: true,
          title: true,
          thumbnail: true,
          previewUrl: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      versions.forEach((version, index) => {
        console.log(`  ${index + 1}. ${version.id} (${version.createdAt.toISOString()})`)
        console.log(`     Thumbnail: ${version.thumbnail ? '✅' : '❌'} ${version.thumbnail?.slice(0, 60) || 'null'}...`)
        console.log(`     Preview: ${version.previewUrl ? '✅' : '❌'} ${version.previewUrl?.slice(0, 60) || 'null'}...`)
      })
      console.log()
    }

    // Check total video count
    const totalVideos = await prisma.video.count()
    const totalDuplicateVideos = duplicates.reduce((sum, dup) => sum + dup._count.originalUrl, 0)
    
    console.log(`📊 Database Summary:`)
    console.log(`- Total videos: ${totalVideos}`)
    console.log(`- Duplicate videos: ${totalDuplicateVideos}`)
    console.log(`- Unique videos: ${totalVideos - totalDuplicateVideos + duplicates.length}`)

  } catch (error) {
    console.error('❌ Failed to check duplicate videos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicateVideos()