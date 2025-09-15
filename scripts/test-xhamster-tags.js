const { xHamsterService } = require('../src/services/xhamster.service')

async function testXHamsterTagsExtraction() {
  console.log('🧪 Testing XHamster tags extraction...\n')

  // Test URLs with different content types
  const testUrls = [
    'https://fra.xhamster.com/videos/from-fleshlights-to-fresh-loads-bffs-viral-cum-smoothie-quest-xhtBSv6',
    'https://fra.xhamster.com/videos/hardcore-3580-6585667',
    'https://fra.xhamster.com/videos/i-love-huge-hanging-tits-3580-13026535'
  ]

  for (const url of testUrls) {
    try {
      console.log(`\n🔍 Testing URL: ${url}`)
      console.log('─'.repeat(80))
      
      const metadata = await xHamsterService.processXHamsterUrl(url)
      
      console.log(`📝 Title: ${metadata.title}`)
      console.log(`📄 Description: ${metadata.description?.substring(0, 100)}${metadata.description?.length > 100 ? '...' : ''}`)
      console.log(`🖼️  Thumbnail: ${metadata.thumbnail ? 'Yes' : 'No'}`)
      console.log(`🎬 Preview URL: ${metadata.previewUrl ? 'Yes' : 'No'}`)
      console.log(`🏷️  Tags (${metadata.tags?.length || 0}):`)
      
      if (metadata.tags && metadata.tags.length > 0) {
        metadata.tags.forEach((tag, index) => {
          console.log(`   ${index + 1}. ${tag}`)
        })
      } else {
        console.log('   No tags extracted')
      }
      
      console.log('─'.repeat(80))
      
    } catch (error) {
      console.error(`❌ Error processing ${url}:`, error.message)
    }
  }
  
  console.log('\n✅ Tags extraction testing completed!')
}

// Run the test if this file is executed directly
if (require.main === module) {
  testXHamsterTagsExtraction()
    .then(() => {
      console.log('\n🎉 Test completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testXHamsterTagsExtraction }