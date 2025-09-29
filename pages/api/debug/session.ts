import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../src/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  // Add database info if requested
  let databaseInfo = null
  if (req.query.includeDb === 'true') {
    try {
      const sampleVideo = await prisma.video.findFirst({
        select: {
          id: true,
          title: true,
          thumbnail: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
      
      const totalCount = await prisma.video.count()
      const withThumbnails = await prisma.video.count({
        where: { thumbnail: { not: null } }
      })
      
      databaseInfo = {
        database: {
          url: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'Not set'
        },
        stats: {
          totalVideos: totalCount,
          videosWithThumbnails: withThumbnails,
          thumbnailCoverage: Math.round((withThumbnails / totalCount) * 100)
        },
        sampleVideo: sampleVideo
      }
    } catch (error) {
      databaseInfo = { error: error instanceof Error ? error.message : 'Unknown error' }
    }
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
    ...(databaseInfo && { database: databaseInfo })
  })
}