import { NextApiRequest, NextApiResponse } from 'next'
import { monitoring, withMonitoring } from '@/src/lib/monitoring'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    })
  }

  try {
    // Get basic health info
    const healthStatus = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    // Track health check metric
    monitoring.trackMetric('health_check_total', 1, { status: 'success' })
    
    return res.status(200).json(healthStatus)
  } catch (error) {
    // Track health check failure
    monitoring.trackError(error as Error, { endpoint: '/api/health' })
    monitoring.trackMetric('health_check_total', 1, { status: 'error' })
    
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
}

export default withMonitoring(handler)