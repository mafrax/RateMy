const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testImprovedTagsExtraction() {
  console.log('🧪 Testing improved XHamster tags extraction...\n')

  try {
    // Find the existing XHamster video
    const xhamsterVideo = await prisma.video.findFirst({
      where: {
        originalUrl: {
          contains: 'xhamster.com'
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!xhamsterVideo) {
      console.log('❌ No XHamster video found in database')
      return
    }

    console.log(`🎬 Found XHamster video: "${xhamsterVideo.title}"`)
    console.log(`🔗 URL: ${xhamsterVideo.originalUrl}`)
    console.log(`🏷️  Current tags (${xhamsterVideo.tags.length}):`)
    xhamsterVideo.tags.forEach((videoTag, index) => {
      console.log(`   ${index + 1}. ${videoTag.tag.name}`)
    })

    console.log('\n🔄 This video will be processed with the improved tags extraction when uploaded next time.')
    console.log('\n💡 To test immediately, you can:')
    console.log('   1. Delete this video from the database')
    console.log('   2. Re-upload it through the web interface')
    console.log('   3. The improved tags extraction will run automatically')

    // Show what tags might be extracted based on title/description analysis
    console.log('\n🤔 Potential tags based on title analysis:')
    const titleLower = xhamsterVideo.title.toLowerCase()
    const potentialTags = []
    
    // Check for common terms
    if (titleLower.includes('blonde')) potentialTags.push('blonde')
    if (titleLower.includes('brunette')) potentialTags.push('brunette')
    if (titleLower.includes('amateur')) potentialTags.push('amateur')
    if (titleLower.includes('milf')) potentialTags.push('milf')
    if (titleLower.includes('teen')) potentialTags.push('teen')
    if (titleLower.includes('big')) potentialTags.push('big-tits')
    if (titleLower.includes('anal')) potentialTags.push('anal')
    if (titleLower.includes('oral')) potentialTags.push('oral')
    if (titleLower.includes('bff') || titleLower.includes('friends')) potentialTags.push('threesome')
    if (titleLower.includes('cum')) potentialTags.push('cumshot')
    if (titleLower.includes('load')) potentialTags.push('cumshot')
    if (titleLower.includes('smoothie') || titleLower.includes('drink')) potentialTags.push('fetish')

    if (potentialTags.length > 0) {
      potentialTags.forEach((tag, index) => {
        console.log(`   ${index + 1}. ${tag}`)
      })
    } else {
      console.log('   None detected from title alone')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testImprovedTagsExtraction()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { testImprovedTagsExtraction }