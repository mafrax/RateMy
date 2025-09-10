const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testRatingCalculations() {
  console.log('🧪 Testing Rating Calculations...\n')
  
  try {
    // Get a video with ratings
    const video = await prisma.video.findFirst({
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
    
    if (!video) {
      console.log('❌ No videos found!')
      return
    }
    
    console.log(`📺 Testing video: "${video.title}"\n`)
    
    // Group ratings by tag
    const ratingsByTag = {}
    video.ratings.forEach(rating => {
      const tagId = rating.tag.id
      const tagName = rating.tag.name
      
      if (!ratingsByTag[tagId]) {
        ratingsByTag[tagId] = {
          name: tagName,
          ratings: []
        }
      }
      
      ratingsByTag[tagId].ratings.push({
        user: rating.user.username,
        level: rating.level
      })
    })
    
    // Calculate and display averages for each tag
    for (const [tagId, data] of Object.entries(ratingsByTag)) {
      const ratings = data.ratings
      const sum = ratings.reduce((acc, r) => acc + r.level, 0)
      const average = sum / ratings.length
      
      console.log(`🏷️  Tag: ${data.name}`)
      console.log(`   Ratings: ${ratings.length}`)
      console.log(`   Individual: ${ratings.map(r => `${r.user}:${r.level}`).join(', ')}`)
      console.log(`   Sum: ${sum}`)
      console.log(`   Average: ${average.toFixed(2)}\n`)
      
      // Verify with database calculation
      const dbAverage = await prisma.rating.aggregate({
        where: {
          videoId: video.id,
          tagId: tagId
        },
        _avg: {
          level: true
        }
      })
      
      const dbResult = dbAverage._avg.level || 0
      
      if (Math.abs(average - dbResult) < 0.001) {
        console.log(`   ✅ Database average matches: ${dbResult.toFixed(2)}`)
      } else {
        console.log(`   ❌ Database mismatch! Expected: ${average.toFixed(2)}, Got: ${dbResult.toFixed(2)}`)
      }
      console.log('')
    }
    
    // Test user-specific rating lookup
    const testUser = await prisma.user.findFirst()
    if (testUser) {
      console.log(`👤 Testing user ratings for: ${testUser.username}`)
      
      const userRatings = video.ratings.filter(r => r.user.id === testUser.id)
      userRatings.forEach(rating => {
        console.log(`   ${rating.tag.name}: ${rating.level}`)
      })
      
      if (userRatings.length === 0) {
        console.log('   No ratings from this user for this video')
      }
    }
    
    console.log('\n🎯 Summary:')
    console.log(`   Total ratings in video: ${video.ratings.length}`)
    console.log(`   Unique tags rated: ${Object.keys(ratingsByTag).length}`)
    console.log(`   Tags associated with video: ${video.tags.length}`)
    
  } catch (error) {
    console.error('❌ Error testing ratings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Test rating API endpoint functionality
async function testRatingPersistence() {
  console.log('\n🔄 Testing Rating Persistence...')
  
  try {
    // Get a test user and video
    const user = await prisma.user.findFirst({
      where: {
        username: 'moviefan123'
      }
    })
    
    const video = await prisma.video.findFirst({
      include: {
        tags: true
      }
    })
    
    if (!user || !video) {
      console.log('❌ Missing test data (user or video)')
      return
    }
    
    if (video.tags.length === 0) {
      console.log('❌ Video has no tags to rate')
      return
    }
    
    const testTag = video.tags[0]
    const originalRating = 3
    const updatedRating = 5
    
    console.log(`Testing with user: ${user.username}`)
    console.log(`Video: ${video.title}`)
    console.log(`Tag: ${testTag.tag.name || 'Unknown'}`)
    
    // Create/update rating
    const rating1 = await prisma.rating.upsert({
      where: {
        videoId_userId_tagId: {
          videoId: video.id,
          userId: user.id,
          tagId: testTag.tagId
        }
      },
      update: {
        level: originalRating
      },
      create: {
        videoId: video.id,
        userId: user.id,
        tagId: testTag.tagId,
        level: originalRating
      }
    })
    
    console.log(`✅ Created/updated rating: ${rating1.level}`)
    
    // Update rating
    const rating2 = await prisma.rating.upsert({
      where: {
        videoId_userId_tagId: {
          videoId: video.id,
          userId: user.id,
          tagId: testTag.tagId
        }
      },
      update: {
        level: updatedRating
      },
      create: {
        videoId: video.id,
        userId: user.id,
        tagId: testTag.tagId,
        level: updatedRating
      }
    })
    
    console.log(`✅ Updated rating: ${rating2.level}`)
    
    // Verify the update
    const finalRating = await prisma.rating.findUnique({
      where: {
        videoId_userId_tagId: {
          videoId: video.id,
          userId: user.id,
          tagId: testTag.tagId
        }
      }
    })
    
    if (finalRating && finalRating.level === updatedRating) {
      console.log('✅ Rating persistence working correctly!')
    } else {
      console.log('❌ Rating persistence failed!')
    }
    
  } catch (error) {
    console.error('❌ Error testing persistence:', error)
  }
}

async function main() {
  await testRatingCalculations()
  await testRatingPersistence()
  console.log('\n🏁 Testing completed!')
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { main }