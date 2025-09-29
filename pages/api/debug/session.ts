import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../src/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  // Test database connection
  let dbTest = 'Testing...'
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Video"`
    dbTest = `Success: ${JSON.stringify(result)}`
  } catch (error) {
    dbTest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
  
  res.json({
    session,
    hasSession: !!session,
    user: session?.user || null,
    method: req.method,
    headers: {
      cookie: req.headers.cookie || 'none',
      authorization: req.headers.authorization || 'none'
    },
    databaseTest: dbTest,
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.slice(0, 20) + '...' || 'NOT_SET'
    }
  })
}