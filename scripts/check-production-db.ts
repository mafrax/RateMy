import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking production database...\n')

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

    // Check for admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@r8my.world' },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    console.log('\n👤 Admin User:')
    if (adminUser) {
      console.log('✅ Admin user found:', {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        isAdmin: adminUser.isAdmin,
        createdAt: adminUser.createdAt.toISOString(),
      })
    } else {
      console.log('❌ Admin user not found')
    }

    // List all tags
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    console.log('\n🏷️  Available Tags:')
    tags.forEach(tag => {
      console.log(`- ${tag.name} (ID: ${tag.id})`)
    })

    // Recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    console.log('\n👥 Recent Users:')
    recentUsers.forEach(user => {
      console.log(`- ${user.username} (${user.email}) ${user.isAdmin ? '🔒 Admin' : ''} - ${user.createdAt.toISOString()}`)
    })

    console.log('\n✅ Database check complete!')

  } catch (error) {
    console.error('❌ Database check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()