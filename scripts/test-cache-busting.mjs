// Test API with cache-busting parameters
async function testCacheBusting() {
  console.log('🔍 Testing API with cache-busting...\n')

  const baseUrl = 'https://r8my.world/api/videos'
  const cacheBuster = Date.now()
  
  const testUrls = [
    `${baseUrl}?limit=5`,
    `${baseUrl}?limit=5&_t=${cacheBuster}`,
    `${baseUrl}?limit=5&includeNsfw=true&_t=${cacheBuster}`,
    `${baseUrl}?limit=5&includeNsfw=false&_t=${cacheBuster}`,
  ]

  for (const url of testUrls) {
    try {
      console.log(`🔄 Testing: ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log(`✅ Success: ${data.data?.length || 0} videos`)
      
      if (data.data && data.data.length > 0) {
        const firstVideo = data.data[0]
        console.log(`   First video ID: ${firstVideo.id}`)
        console.log(`   Title: ${firstVideo.title?.slice(0, 30)}...`)
        console.log(`   Thumbnail: ${firstVideo.thumbnail ? '✅ Present' : '❌ null'}`)
        
        // Check if we get the new videos (with thumbnails)
        const hasNewIds = data.data.some(v => v.id.startsWith('cmfs'))
        const hasOldIds = data.data.some(v => v.id.startsWith('cmg5'))
        console.log(`   Has new IDs (cmfs*): ${hasNewIds}`)
        console.log(`   Has old IDs (cmg5*): ${hasOldIds}`)
      }
      
      console.log()
      
    } catch (error) {
      console.error(`❌ Failed ${url}:`, error.message)
    }
  }
}

testCacheBusting()