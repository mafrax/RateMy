import { redGifsService } from '../src/services/redgifs.service'

async function testRedGifsAPI() {
  console.log('🧪 Testing RedGifs API to get actual media URLs...\n')

  const testGifId = 'attentivechiefrook' // One of our existing gifs
  
  try {
    console.log(`📡 Fetching metadata for: ${testGifId}`)
    
    const metadata = await redGifsService.getGifMetadata(testGifId)
    
    console.log('\n📋 Raw metadata response:')
    console.log(JSON.stringify(metadata, null, 2))
    
    console.log('\n🔗 Available URLs:')
    console.log(`- Title: ${metadata.title}`)
    console.log(`- ID: ${metadata.id}`)
    
    if (metadata.urls) {
      console.log('- Video URLs:')
      console.log(`  - HD: ${metadata.urls.hd}`)
      console.log(`  - SD: ${metadata.urls.sd}`)
    }
    
    if (metadata.urls?.poster) {
      console.log(`- API Thumbnail: ${metadata.urls.poster}`)
    }
    
    console.log('\n🛠️ Service methods:')
    console.log(`- Embed URL: ${redGifsService.getEmbedUrl(testGifId)}`)
    console.log(`- Thumbnail URL: ${redGifsService.getThumbnailUrl(testGifId)}`)
    
    if (metadata.urls) {
      console.log(`- Direct URL: ${redGifsService.getDirectGifUrl(metadata)}`)
    }

  } catch (error) {
    console.error('❌ Failed to fetch RedGifs metadata:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
  }
}

testRedGifsAPI()