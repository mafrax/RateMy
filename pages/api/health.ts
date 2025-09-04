import { NextApiRequest, NextApiResponse } from 'next'
import { getHealthStatus } from '@/lib/diagnostics'
import { logger, logApiRequest } from '@/lib/logger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const healthStatus = await getHealthStatus()
    const duration = Date.now() - startTime
    
    logApiRequest('GET', '/api/health', undefined, duration)
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503
    return res.status(statusCode).json(healthStatus)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    })
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
}