import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/src/lib/database'

interface VideoPreviewRequest {
  url: string
  videoId?: string
}

interface VideoPreviewResponse {
  previewUrl?: string
  thumbnailUrl?: string
  error?: string
  cached?: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VideoPreviewResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, videoId }: VideoPreviewRequest = req.body

  if (!url || !url.includes('xhamster.com')) {
    return res.status(400).json({ error: 'Invalid or unsupported URL' })
  }

  try {
    // First, check if we have this video in the database and it already has a previewUrl
    let existingVideo = null
    try {
      if (videoId) {
        existingVideo = await prisma.video.findUnique({
          where: { id: videoId },
          select: { id: true, previewUrl: true, thumbnail: true }
        })
        
        if (existingVideo?.previewUrl) {
          console.log('Found cached preview URL in database')
          return res.status(200).json({
            previewUrl: existingVideo.previewUrl,
            thumbnailUrl: existingVideo.thumbnail || undefined,
            cached: true
          })
        }
      }

      // If not cached, or no videoId provided, check by originalUrl
      if (!existingVideo) {
        existingVideo = await prisma.video.findFirst({
          where: { originalUrl: url },
          select: { id: true, previewUrl: true, thumbnail: true }
        })
        
        if (existingVideo?.previewUrl) {
          console.log('Found cached preview URL in database by URL')
          return res.status(200).json({
            previewUrl: existingVideo.previewUrl,
            thumbnailUrl: existingVideo.thumbnail || undefined,
            cached: true
          })
        }
      }
    } catch (dbError) {
      console.log('Database query failed (probably missing previewUrl column), proceeding with fetch:', dbError)
      // Continue with fetching from the web
    }
    // Fetch the HTML page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch video page' })
    }

    const html = await response.text()

    // Extract preview video URL from initials-script
    // Look for trailerURL in the script content - try multiple patterns
    const scriptPatterns = [
      /<script id="initials-script"[^>]*>([\s\S]*?)<\/script>/i,
      /<script[^>]*id="initials-script"[^>]*>([\s\S]*?)<\/script>/i,
      /<script[^>]*initials[^>]*>([\s\S]*?)<\/script>/i
    ]
    
    let scriptContent = null
    
    for (const pattern of scriptPatterns) {
      const match = html.match(pattern)
      if (match) {
        scriptContent = match[1]
        console.log('Found script with pattern:', pattern.source)
        break
      }
    }
    
    let previewUrl = undefined
    
    if (scriptContent) {
      console.log('Found script content, length:', scriptContent.length)
      
      // Look for any trailerURL in the script (more flexible regex)
      const patterns = [
        /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.t\.mp4[^"]*)"/gi,
        /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.mp4[^"]*)"/gi,
        /"trailerURL"\s*:\s*"([^"]*\.mp4[^"]*)"/gi
      ]
      
      for (const pattern of patterns) {
        const matches = scriptContent.match(pattern)
        if (matches && matches.length > 0) {
          console.log('Found matches with pattern:', pattern.source, matches)
          // Get the first match and extract URL from capture group
          const firstMatch = matches[0].match(/"trailerURL"\s*:\s*"([^"]*)"/i)
          if (firstMatch) {
            previewUrl = firstMatch[1].replace(/\\\//g, '/')
            console.log('Extracted trailerURL:', previewUrl)
            break
          }
        }
      }
      
      if (!previewUrl) {
        console.log('No trailerURL found in script')
        // Log a sample of the script content to debug
        console.log('Script sample (first 1000 chars):', scriptContent.substring(0, 1000))
      }
    } else {
      console.log('No initials-script found, searching entire HTML')
      
      // Fallback: search the entire HTML for trailerURL
      const patterns = [
        /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.t\.mp4[^"]*)"/gi,
        /"trailerURL"\s*:\s*"([^"]*thumb-v[^"]*\.xhpingcdn\.com[^"]*\.mp4[^"]*)"/gi,
        /"trailerURL"\s*:\s*"([^"]*\.mp4[^"]*)"/gi
      ]
      
      for (const pattern of patterns) {
        const matches = html.match(pattern)
        if (matches && matches.length > 0) {
          console.log('Found matches in HTML with pattern:', pattern.source, matches)
          // Get the first match and extract URL from capture group
          const firstMatch = matches[0].match(/"trailerURL"\s*:\s*"([^"]*)"/i)
          if (firstMatch) {
            previewUrl = firstMatch[1].replace(/\\\//g, '/')
            console.log('Extracted trailerURL from HTML:', previewUrl)
            break
          }
        }
      }
    }

    // Extract thumbnail URL as fallback
    const thumbnailMatch = html.match(/https:\/\/ic-vt-[^"]*\.xhpingcdn\.com\/[^"]*\.jpg/g) ||
                          html.match(/https:\/\/thumb-[^"]*\.xhpingcdn\.com\/[^"]*\.jpg/g)
    const thumbnailUrl = thumbnailMatch ? thumbnailMatch[0] : undefined

    // Save the preview URL to the database if we found one and have a video record
    if (previewUrl && existingVideo?.id) {
      try {
        await prisma.video.update({
          where: { id: existingVideo.id },
          data: { previewUrl: previewUrl }
        })
        console.log('Saved preview URL to database for video:', existingVideo.id)
      } catch (error) {
        console.error('Failed to save preview URL to database (probably missing previewUrl column):', error)
      }
    }

    return res.status(200).json({
      previewUrl,
      thumbnailUrl
    })

  } catch (error) {
    console.error('Error fetching video preview:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}