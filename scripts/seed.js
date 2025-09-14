const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      username: 'johnsmith',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      city: 'New York',
      gender: 'male'
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      username: 'sarahj',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      city: 'Los Angeles',
      gender: 'female'
    }
  })

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Funny' },
      update: {},
      create: { name: 'Funny' }
    }),
    prisma.tag.upsert({
      where: { name: 'Educational' },
      update: {},
      create: { name: 'Educational' }
    }),
    prisma.tag.upsert({
      where: { name: 'Music' },
      update: {},
      create: { name: 'Music' }
    }),
    prisma.tag.upsert({
      where: { name: 'Technology' },
      update: {},
      create: { name: 'Technology' }
    }),
    prisma.tag.upsert({
      where: { name: 'Sports' },
      update: {},
      create: { name: 'Sports' }
    })
  ])

  // Clear existing data first
  await prisma.rating.deleteMany({})
  await prisma.videoTag.deleteMany({})
  await prisma.video.deleteMany({})

  // Create sample videos
  const videos = await Promise.all([
    prisma.video.create({
      data: {
        title: 'Never Gonna Give You Up',
        originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        description: 'Classic music video that became an internet phenomenon',
        userId: user1.id,
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
      }
    }),
    prisma.video.create({
      data: {
        title: 'Me at the zoo',
        originalUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        embedUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
        description: 'The first video ever uploaded to YouTube',
        userId: user2.id,
        thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg'
      }
    }),
    prisma.video.create({
      data: {
        title: 'PSY - GANGNAM STYLE',
        originalUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        embedUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
        description: 'The viral K-pop hit that took the world by storm',
        userId: user1.id,
        thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg'
      }
    }),
    prisma.video.create({
      data: {
        title: 'Despacito',
        originalUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        embedUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
        description: 'Luis Fonsi ft. Daddy Yankee global hit',
        userId: user2.id,
        thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg'
      }
    }),
    prisma.video.create({
      data: {
        title: 'From Fleshlights to Fresh Loads - BFFs Viral Cum Smoothie Quest',
        originalUrl: 'https://fra.xhamster.com/videos/from-fleshlights-to-fresh-loads-bffs-viral-cum-smoothie-quest-xhtBSv6',
        embedUrl: 'https://fra.xhamster.com/videos/from-fleshlights-to-fresh-loads-bffs-viral-cum-smoothie-quest-xhtBSv6',
        description: 'XHamster video with preview functionality',
        userId: user1.id,
        isNsfw: true,
        thumbnail: 'https://thumb-v9.xhpingcdn.com/a/LzAVW-7-axsurn_YwPGVWg/027/166/569/320x320.50.s.webp',
        previewUrl: 'https://thumb-v9.xhpingcdn.com/a/ftmHjmQZL30Ve0lwQE08rw/027/166/569/526x298.78.t.mp4'
      }
    })
  ])

  // Create video-tag relationships
  await Promise.all([
    // Never Gonna Give You Up - Funny, Music
    prisma.videoTag.create({
      data: { videoId: videos[0].id, tagId: tags[0].id }
    }),
    prisma.videoTag.create({
      data: { videoId: videos[0].id, tagId: tags[2].id }
    }),
    // Me at the zoo - Educational, Technology
    prisma.videoTag.create({
      data: { videoId: videos[1].id, tagId: tags[1].id }
    }),
    prisma.videoTag.create({
      data: { videoId: videos[1].id, tagId: tags[3].id }
    }),
    // Gangnam Style - Funny, Music
    prisma.videoTag.create({
      data: { videoId: videos[2].id, tagId: tags[0].id }
    }),
    prisma.videoTag.create({
      data: { videoId: videos[2].id, tagId: tags[2].id }
    }),
    // Despacito - Music
    prisma.videoTag.create({
      data: { videoId: videos[3].id, tagId: tags[2].id }
    }),
    // XHamster video - Funny (assign at least one tag)
    prisma.videoTag.create({
      data: { videoId: videos[4].id, tagId: tags[0].id }
    })
  ])

  // Create sample ratings
  await Promise.all([
    prisma.rating.create({
      data: { userId: user2.id, videoId: videos[0].id, tagId: tags[0].id, level: 9 }
    }),
    prisma.rating.create({
      data: { userId: user2.id, videoId: videos[0].id, tagId: tags[2].id, level: 8 }
    }),
    prisma.rating.create({
      data: { userId: user1.id, videoId: videos[1].id, tagId: tags[1].id, level: 10 }
    }),
    prisma.rating.create({
      data: { userId: user1.id, videoId: videos[2].id, tagId: tags[0].id, level: 7 }
    })
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${videos.length} videos with ${tags.length} tags`)
  console.log(`Sample users: john@example.com and sarah@example.com (password: password123)`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })