import { PrismaClient } from '@prisma/client'

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkVideoSchema() {
  console.log('🔍 Checking videos table schema...\n')

  try {
    await prodPrisma.$connect()

    // Get all columns in videos table
    const columns = await prodPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    ` as any[]

    console.log('📋 Videos table columns:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
    })

    // Test a simple query
    console.log('\n🧪 Testing video query...')
    const videoCount = await prodPrisma.video.count()
    console.log(`✅ Found ${videoCount} videos in database`)

    // Test the problematic query structure
    console.log('\n🧪 Testing problematic query...')
    const videos = await prodPrisma.video.findMany({
      take: 1,
      select: {
        id: true,
        title: true,
        previewUrl: true  // This should work if column exists
      }
    })
    
    console.log(`✅ Query successful, got ${videos.length} videos`)
    if (videos.length > 0) {
      console.log('Sample video:', videos[0])
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error)
    throw error
  } finally {
    await prodPrisma.$disconnect()
  }
}

checkVideoSchema()
  .catch((error) => {
    console.error('Schema check failed:', error)
    process.exit(1)
  })