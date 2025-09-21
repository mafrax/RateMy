import { NextApiRequest, NextApiResponse } from 'next'
import { monitoring } from '@/src/lib/monitoring'
import { withMonitoring } from '@/src/lib/monitoring'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    })
  }

  try {
    const errorSummary = monitoring.getErrorSummary()
    const performanceSummary = monitoring.getPerformanceSummary()

    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      monitoring: {
        errors: errorSummary,
        performance: performanceSummary,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      }
    }

    return res.status(200).json(status)
  } catch (error) {
    monitoring.trackError(error as Error, { endpoint: '/api/monitoring/status' })
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get monitoring status',
      timestamp: new Date().toISOString()
    })
  }
}

export default withMonitoring(handler)