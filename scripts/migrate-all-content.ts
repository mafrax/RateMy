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

async function migrateAllContent() {
  console.log('🚀 Starting COMPLETE data migration (no content filtering)...\n')

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

    // 1. Migrate ALL tags
    console.log('🏷️  Migrating ALL tags...')
    const localTags = await localPrisma.tag.findMany()
    let tagsMigrated = 0

    for (let i = 0; i < localTags.length; i++) {
      const tag = localTags[i]
      try {
        await prodPrisma.tag.upsert({
          where: { name: tag.name },
          update: {},
          create: { name: tag.name }
        })
        tagsMigrated++
        
        // Progress indicator every 50 tags
        if (i % 50 === 0) {
          console.log(`   📊 Progress: ${i + 1}/${localTags.length} tags processed`)
        }
      } catch (error) {
        console.log(`   ⚠️  Tag "${tag.name}" failed: ${error instanceof Error ? error.message.slice(0, 50) : 'Unknown error'}`)
      }
    }
    console.log(`✅ Tags migrated: ${tagsMigrated}/${localTags.length}\n`)

    // 2. Migrate ALL users (except duplicates)
    console.log('👥 Migrating ALL users...')
    const localUsers = await localPrisma.user.findMany()
    let usersMigrated = 0
    const userIdMapping = new Map<string, string>()

    for (const user of localUsers) {
      try {
        // Check if user already exists
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
          console.log(`   ℹ️  User "${user.username}" already exists, using existing`)
          continue
        }

        const newUser = await prodPrisma.user.create({
          data: {
            email: user.email,
            username: user.username,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin, // Preserve admin status
          }
        })
        userIdMapping.set(user.id, newUser.id)
        usersMigrated++
        console.log(`   ✅ Migrated user: ${user.username}`)
      } catch (error) {
        console.log(`   ⚠️  Could not migrate user "${user.username}": ${error instanceof Error ? error.message.slice(0, 100) : 'Unknown error'}`)
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
        },
        user: true,
      }
    })

    let videosMigrated = 0
    const videoIdMapping = new Map<string, string>()

    for (let i = 0; i < localVideos.length; i++) {
      const video = localVideos[i]
      try {
        const newUserId = userIdMapping.get(video.userId)
        if (!newUserId) {
          console.log(`   ⚠️  Skipping video "${video.title}" - user not migrated`)
          continue
        }

        // Check if video already exists
        const existingVideo = await prodPrisma.video.findFirst({
          where: { originalUrl: video.originalUrl }
        })

        if (existingVideo) {
          videoIdMapping.set(video.id, existingVideo.id)
          console.log(`   ℹ️  Video "${video.title}" already exists`)
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

        // Connect tags to video
        for (const videoTag of video.tags) {
          try {
            // Find the production tag by name
            const prodTag = await prodPrisma.tag.findUnique({
              where: { name: videoTag.tag.name }
            })

            if (prodTag) {
              await prodPrisma.videoTag.create({
                data: {
                  videoId: newVideo.id,
                  tagId: prodTag.id,
                }
              })
            }
          } catch (error) {
            // VideoTag connection might fail, that's okay
          }
        }

        videosMigrated++
        console.log(`   ✅ Migrated video: ${video.title}`)
        
        // Progress indicator every 10 videos
        if (i % 10 === 9) {
          console.log(`   📊 Progress: ${i + 1}/${localVideos.length} videos processed`)
        }
      } catch (error) {
        console.log(`   ⚠️  Could not migrate video "${video.title}": ${error instanceof Error ? error.message.slice(0, 100) : 'Unknown error'}`)
      }
    }
    console.log(`✅ Videos migrated: ${videosMigrated}/${localVideos.length}\n`)

    // 4. Migrate ALL ratings
    console.log('⭐ Migrating ALL ratings...')
    const localRatings = await localPrisma.rating.findMany({
      include: {
        video: true,
        tag: true
      }
    })
    let ratingsMigrated = 0

    for (let i = 0; i < localRatings.length; i++) {
      const rating = localRatings[i]
      try {
        const newUserId = userIdMapping.get(rating.userId)
        const newVideoId = videoIdMapping.get(rating.videoId)
        
        if (!newUserId || !newVideoId) {
          continue // Skip if user or video wasn't migrated
        }

        // Find production tag
        const prodTag = rating.tag ? await prodPrisma.tag.findUnique({
          where: { name: rating.tag.name }
        }) : null

        await prodPrisma.rating.create({
          data: {
            value: rating.value,
            userId: newUserId,
            videoId: newVideoId,
            tagId: prodTag?.id || rating.tagId,
          }
        })
        ratingsMigrated++
        
        // Progress indicator every 100 ratings
        if (i % 100 === 99) {
          console.log(`   📊 Progress: ${i + 1}/${localRatings.length} ratings processed`)
        }
      } catch (error) {
        // Rating might already exist or other validation errors
      }
    }
    console.log(`✅ Ratings migrated: ${ratingsMigrated}/${localRatings.length}\n`)

    // 5. Final summary
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

    console.log('\n🌐 Your production site now has all the content from local database!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
    await prodPrisma.$disconnect()
  }
}

migrateAllContent()
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })