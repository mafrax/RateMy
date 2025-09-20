import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/src/lib/auth'
import { logger } from '@/src/lib/logger'

interface FeedbackData {
  feedback: string
  email?: string | null
  timestamp: string
  userAgent: string
  url: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const { feedback, email, timestamp, userAgent, url }: FeedbackData = req.body

    // Validate input
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return res.status(400).json({ message: 'Feedback is required' })
    }

    if (feedback.length > 5000) {
      return res.status(400).json({ message: 'Feedback is too long (max 5000 characters)' })
    }

    // Get user info if logged in
    const userId = session?.user ? (session.user as any).id : null
    const userEmail = session?.user?.email || email || 'anonymous'

    // Prepare feedback data
    const feedbackData = {
      feedback: feedback.trim(),
      email: userEmail,
      userId,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || req.headers['user-agent'] || 'unknown',
      url: url || 'unknown',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    }

    // Log feedback for now (in production, you might want to save to database or send to external service)
    logger.info('🗣️ USER FEEDBACK RECEIVED', {
      feedbackLength: feedback.length,
      hasEmail: !!email,
      userId,
      url,
      userAgent: userAgent?.substring(0, 100) + '...' // Truncate for logging
    })

    // For development/demo purposes, log the full feedback
    console.log('\n' + '='.repeat(80))
    console.log('📧 NEW FEEDBACK RECEIVED')
    console.log('='.repeat(80))
    console.log(`📅 Time: ${feedbackData.timestamp}`)
    console.log(`👤 User: ${userId ? `ID ${userId}` : 'Anonymous'} (${userEmail})`)
    console.log(`🌐 Page: ${url}`)
    console.log(`💻 Browser: ${userAgent?.substring(0, 80)}...`)
    console.log(`🗨️ Feedback:`)
    console.log('-'.repeat(40))
    console.log(feedback)
    console.log('='.repeat(80) + '\n')

    // TODO: In production, you might want to:
    // 1. Save to database
    // 2. Send email notification to development team
    // 3. Send to external service like Slack, Discord, or support ticket system
    // 4. Add rate limiting to prevent spam

    // Example of saving to database (uncomment when ready):
    /*
    const { database } = await import('@/src/lib/database')
    await database.feedback.create({
      data: {
        content: feedback.trim(),
        email: userEmail,
        userId,
        url,
        userAgent,
        createdAt: new Date(timestamp)
      }
    })
    */

    res.status(200).json({ 
      success: true, 
      message: 'Feedback received successfully! Thank you for helping us improve.' 
    })

  } catch (error) {
    logger.error('Error processing feedback', { error })
    console.error('Feedback API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}