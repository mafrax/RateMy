// Direct database script to fix Pornhub previews
// Run with: node scripts/fix-pornhub-previews-direct.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simplified Pornhub service for this script
class SimplePornhubService {
  extractVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:[\w]+\.)?pornhub\.com\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async extractTitle(url) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) return null;

      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                        html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
      
      if (titleMatch) {
        return titleMatch[1].trim().replace(/ - Pornhub\.com$/, '');
      }
      return null;
    } catch (error) {
      console.error('Error extracting title:', error);
      return null;
    }
  }

  async searchBasedPreviewExtraction(title, videoId, originalUrl) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      // Extract domain from original URL
      const urlMatch = originalUrl.match(/https?:\/\/([^.]+\.)?(pornhub\.com)/);
      const domain = urlMatch ? urlMatch[0].replace(/\/$/, '') : 'https://www.pornhub.com';
      
      // Search URL
      const searchQuery = encodeURIComponent(title.trim());
      const searchUrl = `${domain}/video/search?search=${searchQuery}`;
      
      console.log(`  Searching: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) return null;

      const searchHtml = await response.text();
      
      // Check if our video is in search results
      const videoLinkPattern = new RegExp(`/view_video\\.php\\?viewkey=${videoId}`, 'gi');
      const hasOurVideo = searchHtml.match(videoLinkPattern);
      
      if (!hasOurVideo) {
        console.log(`  Video not found in search results`);
        return null;
      }

      console.log(`  Found video in search results`);

      // Find all data-mediabook URLs and all viewkey references
      const allMediabookMatches = searchHtml.match(/data-mediabook="([^"]*)"/gi) || [];
      const allViewkeyMatches = searchHtml.match(new RegExp(`viewkey=${videoId}`, 'gi')) || [];
      
      console.log(`  Found ${allMediabookMatches.length} data-mediabook URLs and ${allViewkeyMatches.length} viewkey matches`);
      
      if (allMediabookMatches.length === 0) {
        console.log(`  ❌ No data-mediabook attributes found in search results`);
        return null;
      }

      // Strategy 1: Find data-mediabook near our viewkey (more flexible patterns)
      const flexiblePatterns = [
        // Within 2000 characters
        new RegExp(`viewkey=${videoId}[\\s\\S]{0,2000}?data-mediabook="([^"]*)"`, 'gi'),
        // Reverse - within 2000 characters
        new RegExp(`data-mediabook="([^"]*)"[\\s\\S]{0,2000}?viewkey=${videoId}`, 'gi'),
        // Even more flexible - within 5000 characters
        new RegExp(`viewkey=${videoId}[\\s\\S]{0,5000}?data-mediabook="([^"]*)"`, 'gi'),
        new RegExp(`data-mediabook="([^"]*)"[\\s\\S]{0,5000}?viewkey=${videoId}`, 'gi')
      ];

      for (let i = 0; i < flexiblePatterns.length; i++) {
        const pattern = flexiblePatterns[i];
        let match = pattern.exec(searchHtml);
        
        if (match) {
          const previewUrl = match[1].replace(/&amp;/g, '&');
          console.log(`  ✅ Found preview (pattern ${i + 1}): ${previewUrl.substring(0, 80)}...`);
          return previewUrl;
        }
      }

      // Strategy 2: If no pattern match, try to find the video container and extract any data-mediabook from it
      // Look for the video container by finding elements that contain both the viewkey and any preview-related attributes
      const containerPatterns = [
        // Look for any element that contains both our viewkey and has data-mediabook somewhere inside
        new RegExp(`<[^>]*[\\s\\S]*?viewkey=${videoId}[\\s\\S]*?data-mediabook="([^"]*)"[\\s\\S]*?>`, 'gi'),
        new RegExp(`<[^>]*[\\s\\S]*?data-mediabook="([^"]*)"[\\s\\S]*?viewkey=${videoId}[\\s\\S]*?>`, 'gi'),
        // Look for list items or divs containing our video
        new RegExp(`<(?:li|div|a)[^>]*>[\\s\\S]*?viewkey=${videoId}[\\s\\S]*?data-mediabook="([^"]*)"[\\s\\S]*?</(?:li|div|a)>`, 'gi'),
        new RegExp(`<(?:li|div|a)[^>]*>[\\s\\S]*?data-mediabook="([^"]*)"[\\s\\S]*?viewkey=${videoId}[\\s\\S]*?</(?:li|div|a)>`, 'gi')
      ];

      for (let i = 0; i < containerPatterns.length; i++) {
        const pattern = containerPatterns[i];
        let match = pattern.exec(searchHtml);
        
        if (match) {
          const previewUrl = match[1].replace(/&amp;/g, '&');
          console.log(`  ✅ Found preview (container pattern ${i + 1}): ${previewUrl.substring(0, 80)}...`);
          return previewUrl;
        }
      }

      // Strategy 3: If still nothing, try a more aggressive approach
      // Since we know our video is in the search results, try to find the first data-mediabook 
      // that appears in a reasonable proximity to our viewkey
      const htmlParts = searchHtml.split(`viewkey=${videoId}`);
      if (htmlParts.length > 1) {
        // Look for data-mediabook in the surrounding area of our viewkey
        for (let i = 1; i < htmlParts.length; i++) {
          const beforeViewkey = htmlParts[i - 1].slice(-3000); // 3000 chars before
          const afterViewkey = htmlParts[i].slice(0, 3000);    // 3000 chars after
          const surroundingText = beforeViewkey + `viewkey=${videoId}` + afterViewkey;
          
          const mediabookMatch = surroundingText.match(/data-mediabook="([^"]*)"/);
          if (mediabookMatch) {
            const previewUrl = mediabookMatch[1].replace(/&amp;/g, '&');
            console.log(`  ✅ Found preview (proximity search): ${previewUrl.substring(0, 80)}...`);
            return previewUrl;
          }
        }
      }

      console.log(`  ❌ Could not extract preview from search results despite finding the video`);
      
      // Debug: Log a sample of what we found
      console.log(`  Debug: First data-mediabook: ${allMediabookMatches[0] ? allMediabookMatches[0].substring(0, 100) + '...' : 'none'}`);
      
      return null;

    } catch (error) {
      console.error('  Error in search-based extraction:', error);
      return null;
    }
  }

  async processUrl(url) {
    const videoId = this.extractVideoId(url);
    if (!videoId) throw new Error('Invalid Pornhub URL');

    // Extract title
    const title = await this.extractTitle(url);
    if (!title) throw new Error('Could not extract title');

    // Use search-based preview extraction
    const previewUrl = await this.searchBasedPreviewExtraction(title, videoId, url);

    return {
      videoId,
      title,
      previewUrl
    };
  }
}

async function fixPornhubPreviews() {
  const pornhubService = new SimplePornhubService();
  
  try {
    console.log('\n=== FIXING PORNHUB PREVIEWS ===');

    // Find all Pornhub videos
    const pornhubVideos = await prisma.video.findMany({
      where: {
        originalUrl: {
          contains: 'pornhub.com'
        }
      },
      select: {
        id: true,
        title: true,
        originalUrl: true,
        previewUrl: true
      }
    });

    console.log(`Found ${pornhubVideos.length} Pornhub videos\n`);

    let successCount = 0;
    let errorCount = 0;
    let noChangeCount = 0;

    for (let i = 0; i < pornhubVideos.length; i++) {
      const video = pornhubVideos[i];
      
      try {
        console.log(`[${i + 1}/${pornhubVideos.length}] Processing: ${video.title}`);
        console.log(`  Current preview: ${video.previewUrl ? video.previewUrl.substring(0, 80) + '...' : 'NONE'}`);

        // Re-extract using search-based approach
        const result = await pornhubService.processUrl(video.originalUrl);
        const newPreviewUrl = result.previewUrl;

        if (newPreviewUrl && newPreviewUrl !== video.previewUrl) {
          // Update the database
          await prisma.video.update({
            where: { id: video.id },
            data: { previewUrl: newPreviewUrl }
          });

          console.log(`  ✅ UPDATED with new preview`);
          successCount++;
        } else if (newPreviewUrl === video.previewUrl) {
          console.log(`  ✓ No change needed - preview is already correct`);
          noChangeCount++;
        } else {
          console.log(`  ❌ Could not find preview`);
          errorCount++;
        }

        console.log(''); // Empty line for readability

        // Add a small delay to be respectful to Pornhub's servers
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        console.log(''); // Empty line for readability
        errorCount++;
      }
    }

    console.log(`=== SUMMARY ===`);
    console.log(`Total videos: ${pornhubVideos.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`No change needed: ${noChangeCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`=== END ===\n`);

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixPornhubPreviews();