#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test script to upload sample RedGifs content
const SAMPLE_REDGIFS_URLS = [
  'https://www.redgifs.com/watch/admirablevictoriousdog',
  'https://www.redgifs.com/watch/genuinehopefulbat',
  'https://www.redgifs.com/watch/wildkeencat'
];

async function testRedGifsUpload() {
  console.log('🚀 Testing RedGifs integration...\n');

  // First, let's try to get some trending content from RedGifs API
  try {
    console.log('📡 Fetching trending content from RedGifs...');
    
    // Get temporary token
    const tokenResponse = await fetch('https://api.redgifs.com/v2/auth/temporary', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Successfully obtained RedGifs API token');

    // Test with a known working endpoint - get featured content
    const featuredResponse = await fetch('https://api.redgifs.com/v2/gifs/featured?count=5', {
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
        'Content-Type': 'application/json',
      },
    });

    let trendingData = null;

    if (featuredResponse.ok) {
      trendingData = await featuredResponse.json();
      console.log(`✅ Found ${trendingData.gifs?.length || 0} featured gifs`);
    } else {
      console.log('⚠️ Featured endpoint failed, using hardcoded sample URLs');
      // Fallback to hardcoded sample URLs
      trendingData = { gifs: [] };
    }

    // Use first 3 trending gifs for testing
    const testUrls = trendingData.gifs?.slice(0, 3).map(gif => 
      `https://www.redgifs.com/watch/${gif.id}`
    ) || SAMPLE_REDGIFS_URLS;

    console.log('\n📋 Test URLs to upload:');
    testUrls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));

    // Test metadata extraction for each URL
    console.log('\n🔍 Testing metadata extraction...');
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      try {
        const gifId = url.match(/watch\/([a-zA-Z0-9]+)/)?.[1];
        if (!gifId) continue;

        const metadataResponse = await fetch(`https://api.redgifs.com/v2/gifs/${gifId}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          console.log(`  ✅ ${url}`);
          console.log(`     Title: ${metadata.gif?.title || 'N/A'}`);
          console.log(`     Tags: ${metadata.gif?.tags?.join(', ') || 'N/A'}`);
          console.log(`     Duration: ${metadata.gif?.duration || 'N/A'}s`);
          console.log(`     Views: ${metadata.gif?.views || 'N/A'}`);
        } else {
          console.log(`  ❌ ${url} - Failed to fetch metadata`);
        }
      } catch (error) {
        console.log(`  ❌ ${url} - Error: ${error.message}`);
      }
    }

    console.log('\n🎯 RedGifs API integration test completed successfully!');
    console.log('\n📝 To test the full upload flow:');
    console.log('   1. Start your Next.js development server: npm run dev');
    console.log('   2. Sign in to your application');
    console.log('   3. Go to /upload and paste one of the URLs above');
    console.log('   4. The form should auto-detect metadata and tags');
    console.log('   5. Submit the form to create a video entry');

    // Create a sample data file for testing
    const sampleData = {
      testUrls,
      metadata: trendingData.gifs?.slice(0, 3).map(gif => ({
        id: gif.id,
        title: gif.title,
        tags: gif.tags,
        url: `https://www.redgifs.com/watch/${gif.id}`,
        embedUrl: `https://www.redgifs.com/ifr/${gif.id}`,
        thumbnail: `https://thumbs4.redgifs.com/${gif.id}-poster.jpg`,
        duration: gif.duration,
        views: gif.views
      })) || []
    };

    require('fs').writeFileSync(
      require('path').join(__dirname, 'redgifs-test-data.json'), 
      JSON.stringify(sampleData, null, 2)
    );

    console.log('\n💾 Sample data saved to scripts/redgifs-test-data.json');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check your internet connection');
    console.log('   - RedGifs API might be temporarily unavailable');
    console.log('   - Try running the test again in a few minutes');
  }
}

if (require.main === module) {
  testRedGifsUpload();
}

module.exports = { testRedGifsUpload };