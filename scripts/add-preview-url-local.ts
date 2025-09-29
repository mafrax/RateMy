import { PrismaClient } from '@prisma/client'

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || 'postgresql://username:password@localhost:5433/ratemy_db'
    }
  }
})

async function addPreviewUrlColumnLocal() {
  console.log('🔧 Adding previewUrl column to LOCAL videos table...\n')

  try {
    await localPrisma.$connect()

    // Check if column already exists
    const result = await localPrisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      AND column_name = 'previewUrl'
      AND table_schema = 'public'
    ` as any[]

    if (result.length > 0) {
      console.log('✅ previewUrl column already exists in local database')
      return
    }

    // Add the column
    await localPrisma.$executeRaw`
      ALTER TABLE videos 
      ADD COLUMN "previewUrl" TEXT NULL
    `

    console.log('✅ Successfully added previewUrl column to LOCAL videos table')

    // Verify the column was added
    const verification = await localPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      AND column_name = 'previewUrl'
      AND table_schema = 'public'
    ` as any[]

    if (verification.length > 0) {
      console.log('✅ Local column verified:', verification[0])
    }

  } catch (error) {
    console.error('❌ Failed to add previewUrl column to local database:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
  }
}

addPreviewUrlColumnLocal()
  .catch((error) => {
    console.error('Local migration failed:', error)
    process.exit(1)
  })