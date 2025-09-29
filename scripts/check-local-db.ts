import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ratemy_dev'
    }
  }
})

async function checkLocalDatabase() {
  console.log('🔍 Checking local database contents...\n')

  try {
    // Count records in each table
    const userCount = await prisma.user.count()
    const videoCount = await prisma.video.count()
    const tagCount = await prisma.tag.count()
    const ratingCount = await prisma.rating.count()

    console.log('📊 Record Counts:')
    console.log(`- Users: ${userCount}`)
    console.log(`- Videos: ${videoCount}`)
    console.log(`- Tags: ${tagCount}`)
    console.log(`- Ratings: ${ratingCount}`)

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
          createdAt: true,
        },
        take: 10
      })

      console.log('\n👥 Users in local database:')
      users.forEach(user => {
        console.log(`- ${user.username} (${user.email}) ${user.isAdmin ? '🔒 Admin' : ''} - ${user.createdAt.toISOString()}`)
      })
    }

    if (videoCount > 0) {
      const videos = await prisma.video.findMany({
        select: {
          id: true,
          title: true,
          originalUrl: true,
          createdAt: true,
        },
        take: 5
      })

      console.log('\n🎥 Videos in local database:')
      videos.forEach(video => {
        console.log(`- "${video.title}" - ${video.originalUrl} - ${video.createdAt.toISOString()}`)
      })
    }

    if (tagCount > 0) {
      const tags = await prisma.tag.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })

      console.log('\n🏷️  Tags in local database:')
      tags.forEach(tag => {
        console.log(`- ${tag.name}`)
      })
    }

    console.log('\n✅ Local database check complete!')

  } catch (error) {
    console.error('❌ Local database check failed:', error)
    console.log('\n💡 Make sure your local Docker PostgreSQL is running and accessible.')
    console.log('💡 Check your DATABASE_URL in .env or set LOCAL_DATABASE_URL')
  } finally {
    await prisma.$disconnect()
  }
}

checkLocalDatabase()