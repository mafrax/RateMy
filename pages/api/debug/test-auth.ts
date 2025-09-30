import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../src/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== AUTH DEBUG START ===')
    console.log('Method:', req.method)
    console.log('Headers:', JSON.stringify(req.headers, null, 2))
    console.log('Cookies:', req.cookies)
    
    // Try to get session
    const session = await getServerSession(req, res, authOptions)
    
    console.log('Session result:', session)
    console.log('Session user:', session?.user)
    console.log('User ID from session:', session?.user?.id)
    
    // Check environment variables
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
    }
    
    console.log('Environment check:', envCheck)
    console.log('=== AUTH DEBUG END ===')
    
    res.json({
      success: true,
      hasSession: !!session,
      session: session,
      user: session?.user || null,
      environment: envCheck,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Auth debug error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}