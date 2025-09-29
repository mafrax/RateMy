import { PrismaClient } from '@prisma/client'

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function addPreviewUrlColumn() {
  console.log('🔧 Adding previewUrl column to videos table...\n')

  try {
    await prodPrisma.$connect()

    // Check if column already exists
    const result = await prodPrisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      AND column_name = 'previewUrl'
      AND table_schema = 'public'
    ` as any[]

    if (result.length > 0) {
      console.log('✅ previewUrl column already exists')
      return
    }

    // Add the column
    await prodPrisma.$executeRaw`
      ALTER TABLE videos 
      ADD COLUMN "previewUrl" TEXT NULL
    `

    console.log('✅ Successfully added previewUrl column to videos table')

    // Verify the column was added
    const verification = await prodPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      AND column_name = 'previewUrl'
      AND table_schema = 'public'
    ` as any[]

    if (verification.length > 0) {
      console.log('✅ Column verified:', verification[0])
    }

  } catch (error) {
    console.error('❌ Failed to add previewUrl column:', error)
    throw error
  } finally {
    await prodPrisma.$disconnect()
  }
}

addPreviewUrlColumn()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })