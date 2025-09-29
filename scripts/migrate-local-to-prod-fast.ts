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

async function migrateFast() {
  console.log('🚀 Starting FAST data migration from local to production...\n')

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

    // 1. Migrate only essential tags (limit to 50 most useful ones)
    console.log('🏷️  Migrating essential tags only...')
    const essentialTagNames = [
      'Comedy', 'Educational', 'Entertainment', 'Gaming', 'Music', 'News', 'Sports', 'Technology',
      'Action', 'Adventure', 'Art', 'Animation', 'Biography', 'Documentary', 'Drama', 'Fantasy',
      'History', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western',
      'amateur', 'professional', 'hd', '4k', 'vintage', 'new', 'trending', 'popular',
      'funny', 'cute', 'beautiful', 'hot', 'sexy', 'cool', 'amazing', 'awesome',
      'short', 'long', 'tutorial', 'review', 'reaction', 'compilation', 'highlights'
    ]

    const localTags = await localPrisma.tag.findMany({
      where: {
        OR: [
          { name: { in: essentialTagNames } },
          { name: { in: ['Comedy', 'Educational', 'Entertainment', 'Gaming', 'Music', 'News', 'Sports', 'Technology'] } }
        ]
      }
    })

    let tagsMigrated = 0
    for (const tag of localTags) {
      try {
        await prodPrisma.tag.upsert({
          where: { name: tag.name },
          update: {},
          create: { name: tag.name }
        })
        tagsMigrated++
      } catch (e) {
        // Tag might already exist
      }
    }
    console.log(`✅ Tags migrated: ${tagsMigrated}/${localTags.length}\n`)

    // 2. Migrate users (excluding test users)
    console.log('👥 Migrating non-test users...')
    const localUsers = await localPrisma.user.findMany({
      where: {
        AND: [
          { email: { not: { contains: '@test.com' } } },
          { email: { not: { contains: 'admin' } } },
          { username: { not: { contains: 'admin' } } },
        ]
      }
    })

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
          console.log(`   ℹ️  User "${user.username}" already exists, mapping to existing`)
          continue
        }

        const newUser = await prodPrisma.user.create({
          data: {
            email: user.email,
            username: user.username,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: false,
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

    // 3. Migrate top 20 videos only
    console.log('🎥 Migrating top 20 videos...')
    const localVideos = await localPrisma.video.findMany({
      include: {
        tags: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    let videosMigrated = 0

    for (const video of localVideos) {
      try {
        const newUserId = userIdMapping.get(video.userId)
        if (!newUserId) {
          console.log(`   ⚠️  Skipping video "${video.title}" - user not migrated`)
          continue
        }

        const existingVideo = await prodPrisma.video.findFirst({
          where: { originalUrl: video.originalUrl }
        })

        if (existingVideo) {
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

        videosMigrated++
        console.log(`   ✅ Migrated video: ${video.title}`)
      } catch (error) {
        console.log(`   ⚠️  Could not migrate video "${video.title}": ${error instanceof Error ? error.message.slice(0, 100) : 'Unknown error'}`)
      }
    }
    console.log(`✅ Videos migrated: ${videosMigrated}/${localVideos.length}\n`)

    // 4. Final summary
    const finalCounts = {
      users: await prodPrisma.user.count(),
      videos: await prodPrisma.video.count(),
      tags: await prodPrisma.tag.count(),
      ratings: await prodPrisma.rating.count(),
    }

    console.log('🎉 Fast migration completed!')
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

migrateFast()
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })