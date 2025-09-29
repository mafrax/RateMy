import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkSpecificVideoIds() {
  console.log('🔍 Checking specific video IDs from API vs Database...\n')

  try {
    await prisma.$connect()

    // API returned these IDs with null thumbnails
    const apiIds = [
      'cmg59bx8a002dxdy254cd7d9s', // Despacito (YouTube)
      'cmg597g4l00psxd9l8gkoukaa', // RedGifs (should have thumbnail)
      'cmg597n3c00qmxd9l3q1tujuu', // Other
      'cmg597jo500q6xd9loy5la36b', // Other
    ]

    console.log('🎯 Checking API video IDs in database:')
    for (const id of apiIds) {
      const video = await prisma.video.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          originalUrl: true,
          thumbnail: true,
          previewUrl: true,
          createdAt: true
        }
      })

      if (video) {
        console.log(`\n✅ Found: ${id}`)
        console.log(`   Title: ${video.title}`)
        console.log(`   URL: ${video.originalUrl}`)
        console.log(`   Created: ${video.createdAt.toISOString()}`)
        console.log(`   Thumbnail: ${video.thumbnail ? '✅ ' + video.thumbnail.slice(0, 80) + '...' : '❌ null'}`)
        console.log(`   Preview: ${video.previewUrl ? '✅ ' + video.previewUrl.slice(0, 80) + '...' : '❌ null'}`)
      } else {
        console.log(`\n❌ NOT FOUND: ${id}`)
      }
    }

    // Check the latest videos in database (what direct query returned)
    console.log('\n\n🎯 Latest videos in database (ordered by createdAt desc):')
    const latestVideos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        originalUrl: true,
        thumbnail: true,
        previewUrl: true,
        createdAt: true
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    latestVideos.forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.id}`)
      console.log(`   Title: ${video.title}`)
      console.log(`   Created: ${video.createdAt.toISOString()}`)
      console.log(`   Thumbnail: ${video.thumbnail ? '✅ ' + video.thumbnail.slice(0, 80) + '...' : '❌ null'}`)
    })

    // Check what API query would return (simulate the repository query)
    console.log('\n\n🎯 Simulating API query (default video fetch):')
    const apiSimulation = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        originalUrl: true,
        thumbnail: true,
        previewUrl: true,
        createdAt: true,
        isNsfw: true
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        // Simulate possible filtering that might be applied
        isNsfw: true // or false - let's see what the default is
      }
    })

    console.log(`Found ${apiSimulation.length} videos with isNsfw=true filter:`)
    apiSimulation.forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.id}`)
      console.log(`   Title: ${video.title}`)
      console.log(`   NSFW: ${video.isNsfw}`)
      console.log(`   Created: ${video.createdAt.toISOString()}`)
      console.log(`   Thumbnail: ${video.thumbnail ? '✅ ' + video.thumbnail.slice(0, 80) + '...' : '❌ null'}`)
    })

  } catch (error) {
    console.error('❌ Failed to check specific video IDs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSpecificVideoIds()