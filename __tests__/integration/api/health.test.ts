import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/health'

describe('/api/health', () => {
  it('should return 200 and health status', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    const data = JSON.parse(res._getData())
    expect(data).toEqual({
      success: true,
      status: 'healthy',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
      version: expect.any(String)
    })
  })

  it('should reject non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    
    const data = JSON.parse(res._getData())
    expect(data).toEqual({
      success: false,
      message: 'Method not allowed'
    })
  })
})