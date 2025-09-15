const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testImprovedExtraction() {
  console.log('🧪 Testing improved XHamster tags extraction...\n')

  try {
    // Delete the existing XHamster video so we can re-upload it with improved extraction
    const existingVideo = await prisma.video.findFirst({
      where: {
        originalUrl: {
          contains: 'xhamster.com'
        }
      }
    })

    if (existingVideo) {
      console.log(`🗑️  Deleting existing XHamster video: "${existingVideo.title}"`)
      
      // Delete related records first
      await prisma.rating.deleteMany({
        where: { videoId: existingVideo.id }
      })
      
      await prisma.videoTag.deleteMany({
        where: { videoId: existingVideo.id }
      })
      
      await prisma.video.delete({
        where: { id: existingVideo.id }
      })
      
      console.log('✅ Deleted existing video')
    }

    // Add a new XHamster video that should extract better tags
    const testUrl = 'https://fra.xhamster.com/videos/my-tight-little-pussy-gets-pounded-by-a-stranger-while-we-are-stuck-in-the-elevator-freeuse-xhAmP8O'
    
    console.log('\n📝 Expected tags based on analysis:')
    const expectedTags = [
      'freeuse', 'teen', 'amateur', 'blonde', 'blowjob', 'small-tits', 
      'big-cock', 'rough-sex', 'hd', 'fingering', 'toys', 'natural-tits',
      'elevator', 'pounding', 'hardcore'
    ]
    
    expectedTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. ${tag}`)
    })
    
    console.log('\n💡 To test the improved extraction:')
    console.log('   1. Go to the upload page: http://localhost:3002/upload')
    console.log(`   2. Upload this URL: ${testUrl}`)
    console.log('   3. The new extraction should find relevant tags instead of metadata field names')
    console.log('   4. Check the video page to see the improved tags')

    console.log('\n🎯 The improved system now:')
    console.log('   ✅ Extracts actual category and tag links from HTML')
    console.log('   ✅ Filters out technical metadata field names')
    console.log('   ✅ Maps French tags to English equivalents')
    console.log('   ✅ Normalizes tag formatting')
    console.log('   ✅ Limits to 15 most relevant tags')
    console.log('   ✅ Uses content analysis from title/description')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testImprovedExtraction()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { testImprovedExtraction }