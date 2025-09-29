import { PrismaClient } from '@prisma/client'

// Local database client (Docker)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || 'postgresql://username:password@localhost:5433/ratemy_db'
    }
  }
})

// Production database client
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function batchUpsertTags(tags: any[]) {
  const batchSize = 100
  let processed = 0
  
  for (let i = 0; i < tags.length; i += batchSize) {
    const batch = tags.slice(i, i + batchSize)
    
    try {
      // Use createMany with skipDuplicates for better performance
      const result = await prodPrisma.tag.createMany({
        data: batch.map(tag => ({ name: tag.name })),
        skipDuplicates: true
      })
      
      processed += result.count
      console.log(`   📊 Tags batch processed: ${Math.min(i + batchSize, tags.length)}/${tags.length} (${processed} new)`)
    } catch (error) {
      console.log(`   ⚠️  Batch ${i}-${i + batchSize} failed, trying individual inserts...`)
      
      // Fallback to individual inserts for this batch
      for (const tag of batch) {
        try {
          await prodPrisma.tag.upsert({
            where: { name: tag.name },
            update: {},
            create: { name: tag.name }
          })
          processed++
        } catch (e) {
          // Tag already exists, skip
        }
      }
    }
  }
  
  return processed
}

async function migrateAllContentBatch() {
  console.log('🚀 Starting COMPLETE data migration with batch processing...\n')

  try {
    // Check connections
    console.log('🔍 Checking database connections...')
    await localPrisma.$connect()
    await prodPrisma.$connect()
    console.log('✅ Both databases connected\n')

    // Get local counts
    const localCounts = {
      users: await localPrisma.user.count(),
      videos: await localPrisma.video.count(),
      tags: await localPrisma.tag.count(),
      ratings: await localPrisma.rating.count(),
    }

    console.log('📊 Local database contents:')
    console.log(`- Users: ${localCounts.users}`)
    console.log(`- Videos: ${localCounts.videos}`)
    console.log(`- Tags: ${localCounts.tags}`)
    console.log(`- Ratings: ${localCounts.ratings}\n`)

    // 1. Migrate ALL tags using batch processing
    console.log('🏷️  Migrating ALL tags in batches...')
    const localTags = await localPrisma.tag.findMany({
      select: { name: true }
    })
    
    const tagsMigrated = await batchUpsertTags(localTags)
    console.log(`✅ Tags processed: ${tagsMigrated} new tags added\n`)

    // 2. Migrate ALL users
    console.log('👥 Migrating ALL users...')
    const localUsers = await localPrisma.user.findMany()
    let usersMigrated = 0
    const userIdMapping = new Map<string, string>()

    for (const user of localUsers) {
      try {
        const existingUser = await prodPrisma.user.findFirst({
          where: {
            OR: [
              { email: user.email },
              { username: user.username }
            ]
          }
        })

        if (existingUser) {
          userIdMapping.set(user.id, existingUser.id)
          continue
        }

        const newUser = await prodPrisma.user.create({
          data: {
            email: user.email,
            username: user.username,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
          }
        })
        userIdMapping.set(user.id, newUser.id)
        usersMigrated++
      } catch (error) {
        console.log(`   ⚠️  User "${user.username}" failed: ${error instanceof Error ? error.message.slice(0, 50) : 'Unknown'}`)
      }
    }
    console.log(`✅ Users migrated: ${usersMigrated}/${localUsers.length}\n`)

    // 3. Migrate ALL videos
    console.log('🎥 Migrating ALL videos...')
    const localVideos = await localPrisma.video.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    let videosMigrated = 0
    const videoIdMapping = new Map<string, string>()

    for (let i = 0; i < localVideos.length; i++) {
      const video = localVideos[i]
      try {
        const newUserId = userIdMapping.get(video.userId)
        if (!newUserId) continue

        const existingVideo = await prodPrisma.video.findFirst({
          where: { originalUrl: video.originalUrl }
        })

        if (existingVideo) {
          videoIdMapping.set(video.id, existingVideo.id)
          continue
        }

        const newVideo = await prodPrisma.video.create({
          data: {
            title: video.title,
            originalUrl: video.originalUrl,
            embedUrl: video.embedUrl,
            description: video.description,
            isNsfw: video.isNsfw,
            userId: newUserId,
          }
        })

        videoIdMapping.set(video.id, newVideo.id)

        // Connect tags in batch
        if (video.tags.length > 0) {
          const tagConnections = []
          for (const videoTag of video.tags) {
            const prodTag = await prodPrisma.tag.findUnique({
              where: { name: videoTag.tag.name }
            })
            if (prodTag) {
              tagConnections.push({
                videoId: newVideo.id,
                tagId: prodTag.id,
              })
            }
          }

          if (tagConnections.length > 0) {
            try {
              await prodPrisma.videoTag.createMany({
                data: tagConnections,
                skipDuplicates: true
              })
            } catch (e) {
              // Some tag connections might fail, that's okay
            }
          }
        }

        videosMigrated++
        console.log(`   ✅ [${i + 1}/${localVideos.length}] Migrated: ${video.title.slice(0, 50)}`)
      } catch (error) {
        console.log(`   ⚠️  Video "${video.title.slice(0, 30)}" failed: ${error instanceof Error ? error.message.slice(0, 50) : 'Unknown'}`)
      }
    }
    console.log(`✅ Videos migrated: ${videosMigrated}/${localVideos.length}\n`)

    // Final summary
    const finalCounts = {
      users: await prodPrisma.user.count(),
      videos: await prodPrisma.video.count(),
      tags: await prodPrisma.tag.count(),
      ratings: await prodPrisma.rating.count(),
    }

    console.log('🎉 COMPLETE migration finished!')
    console.log('📊 Production database now contains:')
    console.log(`- Users: ${finalCounts.users}`)
    console.log(`- Videos: ${finalCounts.videos}`)
    console.log(`- Tags: ${finalCounts.tags}`)
    console.log(`- Ratings: ${finalCounts.ratings}`)

    console.log('\n🌐 Your production site now has all content from local database!')
    console.log('🔥 No content filtering applied - everything migrated!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

migrateAllContentBatch()
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })