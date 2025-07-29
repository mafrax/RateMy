import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../src/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  res.json({
    session,
    hasSession: !!session,
    user: session?.user || null,
    method: req.method,
    headers: {
      cookie: req.headers.cookie || 'none',
      authorization: req.headers.authorization || 'none'
    }
  })
}