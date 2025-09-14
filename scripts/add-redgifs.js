const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Sample RedGifs URLs for testing
const REDGIFS_VIDEOS = [
  {
    title: 'Hot Blonde Dancing',
    originalUrl: 'https://www.redgifs.com/watch/brightuncommonhermitcrab',
    embedUrl: 'https://thumbs2.redgifs.com/BrightUncommonHermitcrab.mp4',
    description: 'Beautiful blonde dancing seductively',
    thumbnail: 'https://thumbs2.redgifs.com/BrightUncommonHermitcrab-mobile.jpg'
  },
  {
    title: 'Sexy Brunette Workout',
    originalUrl: 'https://www.redgifs.com/watch/sleepyalivecheetah',
    embedUrl: 'https://thumbs2.redgifs.com/SleepyAliveCheetah.mp4',
    description: 'Brunette doing yoga in tight outfit',
    thumbnail: 'https://thumbs2.redgifs.com/SleepyAliveCheetah-mobile.jpg'
  },
  {
    title: 'Redhead Beach Fun',
    originalUrl: 'https://www.redgifs.com/watch/defensivehappygoluckybeetle',
    embedUrl: 'https://thumbs2.redgifs.com/DefensiveHappyGoluckyBeetle.mp4', 
    description: 'Gorgeous redhead enjoying the beach',
    thumbnail: 'https://thumbs2.redgifs.com/DefensiveHappyGoluckyBeetle-mobile.jpg'
  },
  {
    title: 'Latina Pool Party',
    originalUrl: 'https://www.redgifs.com/watch/creativelightsteelbluegull',
    embedUrl: 'https://thumbs2.redgifs.com/CreativeLightSteelBlueGull.mp4',
    description: 'Latina having fun at pool party',
    thumbnail: 'https://thumbs2.redgifs.com/CreativeLightSteelBlueGull-mobile.jpg'
  },
  {
    title: 'Asian Girl Dancing',
    originalUrl: 'https://www.redgifs.com/watch/mediocregoldenpanda',
    embedUrl: 'https://thumbs2.redgifs.com/MediocreGoldenPanda.mp4',
    description: 'Asian girl dancing in cute outfit',
    thumbnail: 'https://thumbs2.redgifs.com/MediocreGoldenPanda-mobile.jpg'
  }
]

async function addRedGifsVideos() {
  console.log('🔴 Adding RedGifs videos to database...\n')

  try {
    // Get the first user to assign videos to
    const user = await prisma.user.findFirst()
    if (!user) {
      throw new Error('No users found in database. Please run seed script first.')
    }

    console.log(`Using user: ${user.username} (${user.email})`)

    // Get some existing tags
    const tags = await prisma.tag.findMany({
      take: 10
    })

    const createdVideos = []

    for (const videoData of REDGIFS_VIDEOS) {
      console.log(`\nCreating video: "${videoData.title}"`)
      
      try {
        const video = await prisma.video.create({
          data: {
            title: videoData.title,
            originalUrl: videoData.originalUrl,
            embedUrl: videoData.embedUrl,
            thumbnail: videoData.thumbnail,
            description: videoData.description,
            isNsfw: true, // All RedGifs content is NSFW
            userId: user.id
          }
        })

        createdVideos.push(video)
        console.log(`✅ Created: ${video.title}`)

        // Add 2-3 random tags to each video
        const numTags = Math.floor(Math.random() * 2) + 2 // 2-3 tags
        const shuffledTags = [...tags].sort(() => 0.5 - Math.random())
        const selectedTags = shuffledTags.slice(0, numTags)

        for (const tag of selectedTags) {
          try {
            await prisma.videoTag.create({
              data: {
                videoId: video.id,
                tagId: tag.id
              }
            })
            console.log(`  🏷️  Tagged with: ${tag.name}`)
          } catch (error) {
            if (error.code !== 'P2002') { // Ignore duplicate tag assignments
              console.error(`  ❌ Failed to tag with ${tag.name}:`, error.message)
            }
          }
        }

      } catch (error) {
        console.error(`❌ Failed to create video "${videoData.title}":`, error.message)
      }
    }

    console.log(`\n🎉 Successfully added ${createdVideos.length} RedGifs videos!`)
    
    // Display statistics
    const videoCount = await prisma.video.count()
    const nsfwCount = await prisma.video.count({ where: { isNsfw: true } })
    
    console.log(`\n📊 Updated Database Statistics:`)
    console.log(`Total videos: ${videoCount}`)
    console.log(`NSFW videos: ${nsfwCount}`)
    console.log(`Safe videos: ${videoCount - nsfwCount}`)

    // Show sample RedGifs video
    const sampleRedGifs = createdVideos[0]
    if (sampleRedGifs) {
      console.log(`\n🔍 Sample RedGifs video:`)
      console.log(`Title: ${sampleRedGifs.title}`)
      console.log(`URL: ${sampleRedGifs.originalUrl}`)
      console.log(`Direct MP4: ${sampleRedGifs.embedUrl}`)
      console.log(`Thumbnail: ${sampleRedGifs.thumbnail}`)
      console.log(`NSFW: ${sampleRedGifs.isNsfw}`)
    }

    console.log(`\n✅ RedGifs videos are ready for testing!`)
    console.log(`Visit http://localhost:3002 to see the new content`)

  } catch (error) {
    console.error('❌ Failed to add RedGifs videos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  addRedGifsVideos()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { addRedGifsVideos }