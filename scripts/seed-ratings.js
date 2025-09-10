const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Extended tag list for more variety
const TAGS = [
  'Comedy', 'Drama', 'Action', 'Adventure', 'Horror', 'Thriller',
  'Romance', 'Sci-Fi', 'Fantasy', 'Documentary', 'Music', 'Animation',
  'Crime', 'Mystery', 'War', 'Biography', 'History', 'Sport',
  'Western', 'Musical', 'Family', 'News', 'Reality', 'Talk Show',
  'Educational', 'Tutorial', 'Gaming', 'Cooking', 'Travel', 'Lifestyle',
  'Technology', 'Science', 'Nature', 'Art', 'Fashion', 'Politics'
]

// Sample usernames for test users
const TEST_USERS = [
  'moviefan123', 'criticalviewer', 'casualwatcher', 'filmbuff88',
  'screenaddict', 'cinemageek', 'videoexpert', 'ratingmaster',
  'contentjudge', 'watcheralert', 'reviewguru', 'mediafan',
  'streamwatcher', 'videolover', 'filmcritic', 'moviegoer',
  'contentreader', 'screentime', 'watchlist', 'ratingsystem'
]

// Generate random rating (1-5)
function randomRating() {
  return Math.floor(Math.random() * 5) + 1
}

// Generate random number of ratings per tag (0-8)
function randomRatingCount() {
  return Math.floor(Math.random() * 9)
}

async function createTestUsers() {
  console.log('Creating test users...')
  const hashedPassword = await bcrypt.hash('testpass123', 12)
  
  const users = []
  for (const username of TEST_USERS) {
    try {
      const user = await prisma.user.create({
        data: {
          email: `${username}@test.com`,
          username: username,
          firstName: username.charAt(0).toUpperCase() + username.slice(1),
          lastName: 'Tester',
          password: hashedPassword,
        }
      })
      users.push(user)
      console.log(`✓ Created user: ${username}`)
    } catch (error) {
      if (error.code === 'P2002') {
        // User already exists, fetch it
        const existingUser = await prisma.user.findUnique({
          where: { username }
        })
        if (existingUser) {
          users.push(existingUser)
          console.log(`- User already exists: ${username}`)
        }
      } else {
        console.error(`✗ Error creating user ${username}:`, error.message)
      }
    }
  }
  
  return users
}

async function createTags() {
  console.log('Creating tags...')
  const tags = []
  
  for (const tagName of TAGS) {
    try {
      const tag = await prisma.tag.create({
        data: { name: tagName }
      })
      tags.push(tag)
      console.log(`✓ Created tag: ${tagName}`)
    } catch (error) {
      if (error.code === 'P2002') {
        // Tag already exists, fetch it
        const existingTag = await prisma.tag.findUnique({
          where: { name: tagName }
        })
        if (existingTag) {
          tags.push(existingTag)
          console.log(`- Tag already exists: ${tagName}`)
        }
      } else {
        console.error(`✗ Error creating tag ${tagName}:`, error.message)
      }
    }
  }
  
  return tags
}

async function assignTagsToVideos(tags) {
  console.log('Assigning tags to videos...')
  const videos = await prisma.video.findMany()
  
  if (videos.length === 0) {
    console.log('⚠ No videos found. Please create some videos first.')
    return
  }
  
  for (const video of videos) {
    // Assign 3-8 random tags to each video
    const numTags = Math.floor(Math.random() * 6) + 3
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
        console.log(`✓ Assigned tag "${tag.name}" to video "${video.title}"`)
      } catch (error) {
        if (error.code === 'P2002') {
          // Tag already assigned to video
          console.log(`- Tag "${tag.name}" already assigned to video "${video.title}"`)
        } else {
          console.error(`✗ Error assigning tag ${tag.name} to video ${video.title}:`, error.message)
        }
      }
    }
  }
}

async function createRandomRatings(users, tags) {
  console.log('Creating random ratings...')
  
  // Get all videos with their assigned tags
  const videos = await prisma.video.findMany({
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  })
  
  if (videos.length === 0) {
    console.log('⚠ No videos found. Cannot create ratings.')
    return
  }
  
  let ratingsCreated = 0
  
  for (const video of videos) {
    console.log(`Creating ratings for video: "${video.title}"`)
    
    for (const videoTag of video.tags) {
      const tag = videoTag.tag
      const numRatings = randomRatingCount()
      
      // Select random users to rate this tag
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random())
      const ratingUsers = shuffledUsers.slice(0, numRatings)
      
      for (const user of ratingUsers) {
        try {
          const rating = await prisma.rating.create({
            data: {
              videoId: video.id,
              userId: user.id,
              tagId: tag.id,
              level: randomRating()
            }
          })
          ratingsCreated++
          console.log(`  ✓ ${user.username} rated "${tag.name}": ${rating.level}`)
        } catch (error) {
          if (error.code === 'P2002') {
            // Rating already exists, update it
            try {
              const updatedRating = await prisma.rating.update({
                where: {
                  videoId_userId_tagId: {
                    videoId: video.id,
                    userId: user.id,
                    tagId: tag.id
                  }
                },
                data: {
                  level: randomRating()
                }
              })
              console.log(`  ↻ Updated ${user.username} rating for "${tag.name}": ${updatedRating.level}`)
            } catch (updateError) {
              console.error(`  ✗ Error updating rating:`, updateError.message)
            }
          } else {
            console.error(`  ✗ Error creating rating:`, error.message)
          }
        }
      }
    }
  }
  
  console.log(`🎉 Created/updated ${ratingsCreated} ratings!`)
}

async function displayStatistics() {
  console.log('\n📊 Database Statistics:')
  
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.tag.count(),
    prisma.rating.count(),
    prisma.videoTag.count()
  ])
  
  console.log(`Users: ${stats[0]}`)
  console.log(`Videos: ${stats[1]}`)
  console.log(`Tags: ${stats[2]}`)
  console.log(`Ratings: ${stats[3]}`)
  console.log(`Video-Tag associations: ${stats[4]}`)
  
  // Sample ratings for first video
  const firstVideo = await prisma.video.findFirst({
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      ratings: {
        include: {
          user: true,
          tag: true
        }
      }
    }
  })
  
  if (firstVideo) {
    console.log(`\n🎬 Sample ratings for "${firstVideo.title}":`)
    const ratingsByTag = {}
    
    firstVideo.ratings.forEach(rating => {
      const tagName = rating.tag.name
      if (!ratingsByTag[tagName]) {
        ratingsByTag[tagName] = []
      }
      ratingsByTag[tagName].push({
        user: rating.user.username,
        level: rating.level
      })
    })
    
    Object.entries(ratingsByTag).forEach(([tagName, ratings]) => {
      const average = ratings.reduce((sum, r) => sum + r.level, 0) / ratings.length
      console.log(`  ${tagName}: ${ratings.length} ratings, avg ${average.toFixed(1)}`)
      ratings.forEach(r => {
        console.log(`    - ${r.user}: ${r.level}`)
      })
    })
  }
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...\n')
    
    const users = await createTestUsers()
    console.log(`Created ${users.length} test users\n`)
    
    const tags = await createTags()
    console.log(`Created ${tags.length} tags\n`)
    
    await assignTagsToVideos(tags)
    console.log('Assigned tags to videos\n')
    
    await createRandomRatings(users, tags)
    console.log('Created random ratings\n')
    
    await displayStatistics()
    
    console.log('\n✅ Seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { main }