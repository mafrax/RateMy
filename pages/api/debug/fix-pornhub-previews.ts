import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/src/lib/auth'
import { database } from '@/src/lib/database'
import { pornhubService } from '@/src/services/pornhub.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('\n=== FIXING PORNHUB PREVIEWS ===')

    // Find all Pornhub videos
    const pornhubVideos = await database.video.findMany({
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
    })

    console.log(`Found ${pornhubVideos.length} Pornhub videos`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const video of pornhubVideos) {
      try {
        console.log(`\n--- Processing: ${video.title} ---`)
        console.log(`Original URL: ${video.originalUrl}`)
        console.log(`Current Preview: ${video.previewUrl || 'NONE'}`)

        // Re-extract metadata using the fixed service
        const result = await pornhubService.processUrl(video.originalUrl)
        const newPreviewUrl = result.previewUrl

        console.log(`New Preview: ${newPreviewUrl || 'NONE'}`)

        if (newPreviewUrl && newPreviewUrl !== video.previewUrl) {
          // Update the database
          await database.video.update({
            where: { id: video.id },
            data: { previewUrl: newPreviewUrl }
          })

          console.log(`✅ UPDATED: ${video.title}`)
          results.push({
            id: video.id,
            title: video.title,
            status: 'updated',
            oldPreview: video.previewUrl,
            newPreview: newPreviewUrl
          })
          successCount++
        } else if (newPreviewUrl === video.previewUrl) {
          console.log(`✓ No change needed: ${video.title}`)
          results.push({
            id: video.id,
            title: video.title,
            status: 'unchanged',
            preview: newPreviewUrl
          })
        } else {
          console.log(`❌ Could not find preview: ${video.title}`)
          results.push({
            id: video.id,
            title: video.title,
            status: 'no-preview-found',
            oldPreview: video.previewUrl
          })
        }

      } catch (error) {
        console.error(`❌ Error processing ${video.title}:`, error)
        results.push({
          id: video.id,
          title: video.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        errorCount++
      }
    }

    console.log(`\n=== SUMMARY ===`)
    console.log(`Total videos: ${pornhubVideos.length}`)
    console.log(`Successfully updated: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`=== END ===\n`)

    res.status(200).json({
      success: true,
      message: `Processed ${pornhubVideos.length} Pornhub videos`,
      summary: {
        total: pornhubVideos.length,
        updated: successCount,
        errors: errorCount
      },
      results
    })

  } catch (error) {
    console.error('Error fixing Pornhub previews:', error)
    res.status(500).json({ 
      error: 'Failed to fix Pornhub previews',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}