import { NextApiRequest, NextApiResponse } from 'next'
import { pornhubService } from '@/src/services/pornhub.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: 'url is required' })
    }

    console.log('\n=== TESTING PORNHUB URL ===')
    console.log('URL:', url)
    
    const result = await pornhubService.processUrl(url)
    
    console.log('Result:', JSON.stringify(result, null, 2))
    console.log('=== END TEST ===\n')

    res.status(200).json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error testing Pornhub URL:', error)
    res.status(500).json({ 
      error: 'Failed to test URL',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}