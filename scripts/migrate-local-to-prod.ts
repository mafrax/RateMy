import { PrismaClient } from '@prisma/client'

// Local database client (Docker)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || 'postgresql://user:password@localhost:5432/ratemy_dev'
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

async function migrateData() {
  console.log('🚀 Starting data migration from local to production...\n')

  try {
    // 1. Check connections
    console.log('🔍 Checking database connections...')
    await localPrisma.$connect()
    await prodPrisma.$connect()
    console.log('✅ Both databases connected\n')

    // 2. Get local data counts
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

    if (localCounts.users === 0 && localCounts.videos === 0) {
      console.log('⚠️  Local database appears to be empty. Nothing to migrate.')
      return
    }

    // 3. Migrate Tags (merge with existing)
    console.log('🏷️  Migrating tags...')
    const localTags = await localPrisma.tag.findMany()
    let tagsMigrated = 0

    for (const tag of localTags) {
      try {
        await prodPrisma.tag.upsert({
          where: { name: tag.name },
          update: {},
          create: {
            name: tag.name,
          }
        })
        tagsMigrated++
      } catch (error) {
        console.log(`   ⚠️  Tag "${tag.name}" already exists or error occurred`)
      }
    }
    console.log(`✅ Tags processed: ${tagsMigrated}/${localTags.length}\n`)

    // 4. Migrate Users (excluding admin and test users)
    console.log('👥 Migrating users...')
    const localUsers = await localPrisma.user.findMany({
      where: {
        AND: [
          { email: { not: { contains: 'admin' } } },
          { email: { not: { contains: 'test' } } },
          { username: { not: { contains: 'admin' } } },
          { username: { not: { contains: 'test' } } },
        ]
      }
    })

    let usersMigrated = 0
    const userIdMapping = new Map<string, string>()

    for (const user of localUsers) {
      try {
        const newUser = await prodPrisma.user.create({
          data: {
            email: user.email,
            username: `${user.username}_migrated`, // Add suffix to avoid conflicts
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: false, // Don't migrate admin privileges
          }
        })
        userIdMapping.set(user.id, newUser.id)
        usersMigrated++
      } catch (error) {
        console.log(`   ⚠️  User "${user.username}" could not be migrated: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    console.log(`✅ Users migrated: ${usersMigrated}/${localUsers.length}\n`)

    // 5. Migrate Videos
    console.log('🎥 Migrating videos...')
    const localVideos = await localPrisma.video.findMany({
      include: {
        tags: true,
      }
    })

    let videosMigrated = 0

    for (const video of localVideos) {
      try {
        // Get the migrated user ID, or skip if user wasn't migrated
        const newUserId = userIdMapping.get(video.userId)
        if (!newUserId) {
          console.log(`   ⚠️  Skipping video "${video.title}" - user not migrated`)
          continue
        }

        // Create video
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

        // Connect tags
        for (const tag of video.tags) {
          try {
            await prodPrisma.videoTag.create({
              data: {
                videoId: newVideo.id,
                tagId: tag.tagId,
              }
            })
          } catch (error) {
            // Tag connection might fail if tag doesn't exist
            console.log(`   ⚠️  Could not connect tag to video "${video.title}"`)
          }
        }

        videosMigrated++
      } catch (error) {
        console.log(`   ⚠️  Video "${video.title}" could not be migrated: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    console.log(`✅ Videos migrated: ${videosMigrated}/${localVideos.length}\n`)

    // 6. Migrate Ratings
    console.log('⭐ Migrating ratings...')
    const localRatings = await localPrisma.rating.findMany()
    let ratingsMigrated = 0

    for (const rating of localRatings) {
      try {
        const newUserId = userIdMapping.get(rating.userId)
        if (!newUserId) continue // Skip if user wasn't migrated

        // Find corresponding video in production
        const prodVideo = await prodPrisma.video.findFirst({
          where: { title: rating.video?.title } // This is a simplified match
        })

        if (!prodVideo) continue // Skip if video doesn't exist

        await prodPrisma.rating.create({
          data: {
            value: rating.value,
            userId: newUserId,
            videoId: prodVideo.id,
            tagId: rating.tagId,
          }
        })
        ratingsMigrated++
      } catch (error) {
        // Rating might already exist or other validation errors
      }
    }
    console.log(`✅ Ratings migrated: ${ratingsMigrated}/${localRatings.length}\n`)

    // 7. Final summary
    const finalCounts = {
      users: await prodPrisma.user.count(),
      videos: await prodPrisma.video.count(),
      tags: await prodPrisma.tag.count(),
      ratings: await prodPrisma.rating.count(),
    }

    console.log('🎉 Migration completed!')
    console.log('📊 Production database now contains:')
    console.log(`- Users: ${finalCounts.users}`)
    console.log(`- Videos: ${finalCounts.videos}`)
    console.log(`- Tags: ${finalCounts.tags}`)
    console.log(`- Ratings: ${finalCounts.ratings}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

// Handle command line execution
if (require.main === module) {
  migrateData()
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateData }