import { NextApiRequest, NextApiResponse } from 'next'
import { monitoring } from '@/src/lib/monitoring'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    })
  }

  try {
    // Generate Prometheus metrics
    const metrics = monitoring.getMetricsForPrometheus()
    
    // Set appropriate headers for Prometheus
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.status(200).send(metrics)
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate metrics'
    })
  }
}