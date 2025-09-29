import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  // Validate that it's a RedGifs thumbnail URL
  if (!url.includes('redgifs.com') || !url.includes('-poster.jpg')) {
    return res.status(400).json({ error: 'Invalid RedGifs thumbnail URL' })
  }

  try {
    // Fetch the image from RedGifs
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RateMy/1.0)',
        // Remove the referer that's causing hotlinking protection issues
        'Referer': 'https://www.redgifs.com/',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Failed to fetch thumbnail: ${response.status} ${response.statusText}` 
      })
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Set appropriate headers for caching
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Send the image
    res.send(Buffer.from(imageBuffer))
  } catch (error) {
    console.error('Error proxying RedGifs thumbnail:', error)
    return res.status(500).json({ error: 'Failed to proxy thumbnail' })
  }
}