#!/usr/bin/env node

/**
 * Test the Reddit service directly
 */

// Simple test to check Reddit service functionality
async function testRedditService() {
  console.log('🧪 Testing Reddit service directly...')
  
  const redditUrl = 'https://www.reddit.com/r/HugeDickTinyChick/comments/1ne9m9z/shes_petite_body_but_got_bangers_tits/'
  
  try {
    // Test URL pattern matching
    const redditRegex = /(?:https?:\/\/)?(?:www\.|old\.|m\.|np\.)?reddit\.com\/r\/(\w+)\/comments\/([a-zA-Z0-9]+)(?:\/([^/]+))?/i
    const match = redditUrl.match(redditRegex)
    
    if (match) {
      console.log('✅ URL parsing successful:')
      console.log('   Subreddit:', match[1])
      console.log('   Post ID:', match[2])
      console.log('   Slug:', match[3])
    } else {
      console.log('❌ URL parsing failed')
      return
    }

    // Test Reddit API call
    console.log('\\n🌐 Testing Reddit API call...')
    const jsonUrl = `https://www.reddit.com/r/${match[1]}/comments/${match[2]}.json`
    console.log('API URL:', jsonUrl)
    
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'RateMy Video Platform/1.0 (Educational Content Aggregator)',
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        const postData = data[0].data.children[0].data
        
        console.log('✅ Reddit API successful:')
        console.log('   Title:', postData.title)
        console.log('   Author:', postData.author)
        console.log('   Subreddit:', postData.subreddit)
        console.log('   NSFW:', postData.over_18)
        console.log('   Upvotes:', postData.ups)
        console.log('   Comments:', postData.num_comments)
        console.log('   Domain:', postData.domain)
        console.log('   URL:', postData.url)
        console.log('   Is Video:', postData.is_video)
        
        if (postData.media && postData.media.reddit_video) {
          console.log('   Reddit Video URL:', postData.media.reddit_video.fallback_url)
        }
        
        if (postData.preview && postData.preview.images) {
          console.log('   Thumbnail:', postData.preview.images[0]?.source?.url)
        }

      } else {
        console.log('❌ Invalid Reddit response format')
      }
    } else {
      console.log('❌ Reddit API failed:', response.status)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testRedditService()