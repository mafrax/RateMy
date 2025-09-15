#!/usr/bin/env node

/**
 * Test script to verify XHamster tag extraction
 * Tests the specific URL provided by the user
 */

const { xHamsterService } = require('../src/services/xhamster.service.ts')

async function testXHamsterTagExtraction() {
  console.log('🧪 Testing XHamster tag extraction...\n')
  
  const testUrl = 'https://fra.xhamster.com/videos/parties-carrees-campagnardes-1980-france-full-movie-hd-xhu3uQ6'
  
  try {
    console.log(`📡 Fetching metadata from: ${testUrl}`)
    const metadata = await xHamsterService.processXHamsterUrl(testUrl)
    
    console.log('\n📊 Extracted Metadata:')
    console.log('='.repeat(50))
    console.log(`Title: ${metadata.title || 'N/A'}`)
    console.log(`Description: ${metadata.description || 'N/A'}`)
    console.log(`Thumbnail: ${metadata.thumbnail ? 'Yes' : 'No'}`)
    console.log(`Preview URL: ${metadata.previewUrl ? 'Yes' : 'No'}`)
    
    console.log('\n🏷️ Extracted Tags:')
    console.log('='.repeat(50))
    if (metadata.tags && metadata.tags.length > 0) {
      metadata.tags.forEach((tag, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${tag}`)
      })
      console.log(`\n📈 Total tags extracted: ${metadata.tags.length}`)
    } else {
      console.log('❌ No tags found')
    }
    
    // Expected tags based on the provided HTML
    const expectedTags = [
      'french', 'european', 'party', 'retro', 'hd', 'cougar', 'hardcore', 
      'milf', 'mature', 'vintage', 'movie', 'french-hardcore', 
      'vintage-1970s', 'french-classic', '1980s', 'french-milf', 
      'classic-hardcore', 'hardcore-milf', 'hardcore-party'
    ]
    
    console.log('\n🎯 Expected vs Extracted Comparison:')
    console.log('='.repeat(50))
    console.log('Expected tags (based on HTML analysis):')
    expectedTags.forEach((tag, index) => {
      const found = metadata.tags?.includes(tag)
      console.log(`  ${found ? '✅' : '❌'} ${tag}`)
    })
    
    if (metadata.tags) {
      const unexpectedTags = metadata.tags.filter(tag => !expectedTags.includes(tag))
      if (unexpectedTags.length > 0) {
        console.log('\n🔍 Additional extracted tags:')
        unexpectedTags.forEach(tag => console.log(`  ➕ ${tag}`))
      }
    }
    
  } catch (error) {
    console.error('❌ Error during tag extraction:', error.message)
    console.error(error.stack)
  }
}

// Run the test
testXHamsterTagExtraction()