import { PrismaClient } from '@prisma/client'

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function debugConnection() {
  console.log('🔍 Debugging database connection...\n')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/\/\/[^:]*:[^@]*@/, '//***:***@'))
  
  try {
    await prodPrisma.$connect()

    // Check database name
    const dbInfo = await prodPrisma.$queryRaw`
      SELECT current_database() as database_name, current_user as user_name
    ` as any[]
    
    console.log('✅ Connected to database:', dbInfo[0])

    // Check if videos table exists
    const tableExists = await prodPrisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'videos'
    ` as any[]
    
    console.log('Videos table exists:', tableExists.length > 0)

    // Check all columns in videos table
    const columns = await prodPrisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'videos' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    ` as any[]

    console.log('\n📋 Videos table columns:')
    if (columns.length === 0) {
      console.log('❌ No columns found - table might not exist')
    } else {
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
      })
    }

    // Count videos
    try {
      const count = await prodPrisma.$queryRaw`SELECT COUNT(*) as count FROM videos` as any[]
      console.log(`\n📊 Video count: ${count[0].count}`)
    } catch (error) {
      console.log('\n❌ Could not count videos:', error instanceof Error ? error.message : 'Unknown error')
    }

  } catch (error) {
    console.error('❌ Connection failed:', error)
  } finally {
    await prodPrisma.$disconnect()
  }
}

debugConnection()