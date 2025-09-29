// Debug script to check what the API is actually returning
async function debugApiResponse() {
  console.log('🔍 Testing API response for video data...\n')

  try {
    const response = await fetch('https://r8my.world/api/videos?limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('📊 API Response Structure:')
    console.log('- Success:', data.success)
    console.log('- Data length:', data.data?.length || 0)
    console.log('- Pagination:', data.pagination)
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 First video data structure:')
      const firstVideo = data.data[0]
      
      // List all available fields
      console.log('Available fields:', Object.keys(firstVideo))
      
      console.log('\n🎬 Video details:')
      console.log('- ID:', firstVideo.id)
      console.log('- Title:', firstVideo.title)
      console.log('- Original URL:', firstVideo.originalUrl)
      console.log('- Embed URL:', firstVideo.embedUrl)
      console.log('- Thumbnail:', firstVideo.thumbnail)
      console.log('- Preview URL:', firstVideo.previewUrl)
      console.log('- Is NSFW:', firstVideo.isNsfw)
      
      console.log('\n📸 Checking thumbnail data for all videos:')
      data.data.forEach((video, index) => {
        const platform = video.originalUrl?.includes('redgifs.com') ? 'RedGifs' :
                        video.originalUrl?.includes('pornhub.com') ? 'Pornhub' :
                        video.originalUrl?.includes('xhamster.com') ? 'XHamster' :
                        video.originalUrl?.includes('youtube.com') ? 'YouTube' : 'Other'
                        
        console.log(`${index + 1}. [${platform}] ${video.title?.slice(0, 30)}...`)
        console.log(`   Thumbnail: ${video.thumbnail ? '✅ ' + video.thumbnail.slice(0, 80) + '...' : '❌ null/undefined'}`)
        console.log(`   Preview: ${video.previewUrl ? '✅ ' + video.previewUrl.slice(0, 80) + '...' : '❌ null/undefined'}`)
      })
    }

  } catch (error) {
    console.error('❌ Failed to fetch API data:', error)
  }
}

debugApiResponse()