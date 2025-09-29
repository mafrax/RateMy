import { PrismaClient } from '@prisma/client'

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || 'postgresql://username:password@localhost:5433/ratemy_db'
    }
  }
})

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function migrateVideosSimple() {
  console.log('🎥 Migrating ALL videos with simple approach...\n')

  try {
    await localPrisma.$connect()
    await prodPrisma.$connect()

    // Get local videos
    const localVideos = await localPrisma.video.findMany({
      include: {
        user: true
      }
    })

    console.log(`Found ${localVideos.length} videos to migrate\n`)

    // Create user mapping (local ID -> production ID)
    const userMapping = new Map<string, string>()
    const localUsers = await localPrisma.user.findMany()
    
    for (const localUser of localUsers) {
      const prodUser = await prodPrisma.user.findFirst({
        where: {
          OR: [
            { email: localUser.email },
            { username: localUser.username }
          ]
        }
      })
      
      if (prodUser) {
        userMapping.set(localUser.id, prodUser.id)
      }
    }

    console.log(`User mapping created for ${userMapping.size} users\n`)

    let videosMigrated = 0

    for (let i = 0; i < localVideos.length; i++) {
      const video = localVideos[i]
      try {
        const prodUserId = userMapping.get(video.userId)
        if (!prodUserId) {
          console.log(`   ⚠️  Skipping "${video.title.slice(0, 30)}" - user not found`)
          continue
        }

        // Skip if video already exists
        const existingVideo = await prodPrisma.video.count({
          where: { originalUrl: video.originalUrl }
        })

        if (existingVideo > 0) {
          console.log(`   ℹ️  "${video.title.slice(0, 30)}" already exists`)
          continue
        }

        // Create video without complex queries
        await prodPrisma.video.create({
          data: {
            title: video.title,
            originalUrl: video.originalUrl,
            embedUrl: video.embedUrl,
            description: video.description,
            isNsfw: video.isNsfw,
            userId: prodUserId,
          }
        })

        videosMigrated++
        console.log(`   ✅ [${i + 1}/${localVideos.length}] Migrated: "${video.title.slice(0, 40)}"`)
        
      } catch (error) {
        console.log(`   ❌ "${video.title.slice(0, 30)}" failed: ${error instanceof Error ? error.message.slice(0, 60) : 'Unknown'}`)
      }
    }

    console.log(`\n🎉 Videos migration complete!`)
    console.log(`✅ Successfully migrated: ${videosMigrated}/${localVideos.length} videos`)

    const finalVideoCount = await prodPrisma.video.count()
    console.log(`📊 Total videos in production: ${finalVideoCount}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

migrateVideosSimple()
  .catch((error) => {
    console.error('Video migration failed:', error)
    process.exit(1)
  })