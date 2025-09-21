import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    })
  }

  // Get current environment CSP
  const environment = (process.env.NODE_ENV as 'development' | 'production') || 'development'
  
  const enhancedCSP = {
    development: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' ws://localhost:* ws://127.0.0.1:*",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://*.phncdn.com https://ei.phncdn.com https://pix-cdn77.phncdn.com https://i.redd.it https://*.redditmedia.com https://*.reddit.com https://preview.redd.it https://external-preview.redd.it https://*.ytimg.com https://img.youtube.com https://*.youtube.com https://*.googleusercontent.com https://*.ggpht.com https://i.imgur.com https://*.imgur.com",
      "media-src 'self' blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://v.redd.it https://*.youtube.com https://*.googlevideo.com",
      "frame-src 'self' https://www.redgifs.com https://redgifs.com https://www.pornhub.com https://pornhub.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self' https://api.redgifs.com https://www.reddit.com https://www.youtube.com https://*.youtube.com https://www.googleapis.com ws://localhost:* ws://127.0.0.1:*",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; '),
    
    production: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://*.youtube.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://*.phncdn.com https://ei.phncdn.com https://pix-cdn77.phncdn.com https://i.redd.it https://*.redditmedia.com https://*.reddit.com https://preview.redd.it https://external-preview.redd.it https://*.ytimg.com https://img.youtube.com https://*.youtube.com https://*.googleusercontent.com https://*.ggpht.com https://i.imgur.com https://*.imgur.com",
      "media-src 'self' blob: https://*.redgifs.com https://*.xhamster.com https://*.pornhub.com https://v.redd.it https://*.youtube.com https://*.googlevideo.com",
      "frame-src 'self' https://www.redgifs.com https://redgifs.com https://www.pornhub.com https://pornhub.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self' https://api.redgifs.com https://www.reddit.com https://www.youtube.com https://*.youtube.com https://www.googleapis.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  }

  return res.status(200).json({
    success: true,
    environment,
    csp: enhancedCSP[environment],
    breakdown: {
      'img-src': extractDirective(enhancedCSP[environment], 'img-src'),
      'frame-src': extractDirective(enhancedCSP[environment], 'frame-src'),
      'script-src': extractDirective(enhancedCSP[environment], 'script-src'),
      'connect-src': extractDirective(enhancedCSP[environment], 'connect-src'),
      'media-src': extractDirective(enhancedCSP[environment], 'media-src'),
    },
    testUrls: {
      reddit: [
        'https://i.redd.it',
        'https://preview.redd.it',
        'https://external-preview.redd.it',
        'https://www.reddit.com',
        'https://old.reddit.com',
        'https://np.reddit.com'
      ],
      youtube: [
        'https://www.youtube.com',
        'https://img.youtube.com',
        'https://i.ytimg.com',
        'https://www.youtube-nocookie.com'
      ],
      redgifs: [
        'https://www.redgifs.com',
        'https://thumbs2.redgifs.com',
        'https://api.redgifs.com'
      ]
    }
  })
}

function extractDirective(csp: string, directive: string): string[] {
  const match = csp.match(new RegExp(`${directive}\\s+([^;]+)`))
  return match ? match[1].split(' ').map(s => s.trim()).filter(s => s) : []
}