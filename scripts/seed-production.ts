import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding production database...')

  // Get admin credentials from environment
  const adminEmail = process.env.ADMIN_EMAIL
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminFirstName = process.env.ADMIN_FIRST_NAME
  const adminLastName = process.env.ADMIN_LAST_NAME

  if (!adminEmail || !adminUsername || !adminPassword) {
    throw new Error('Admin credentials not found in environment variables')
  }

  // Hash the admin password
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // Check if admin user exists by email or username
  let adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { username: adminUsername }
      ]
    }
  })

  if (adminUser) {
    // Update existing user to be admin
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        isAdmin: true,
        firstName: adminFirstName,
        lastName: adminLastName,
      }
    })
    console.log('✅ Existing user updated to admin')
  } else {
    // Create new admin user
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        isAdmin: true,
      }
    })
    console.log('✅ New admin user created')
  }

  console.log('✅ Admin user created/updated:', {
    id: adminUser.id,
    email: adminUser.email,
    username: adminUser.username,
    isAdmin: adminUser.isAdmin,
  })

  // Create some sample tags if they don't exist
  const sampleTags = [
    'Comedy',
    'Educational',
    'Music',
    'Technology',
    'Entertainment',
    'Sports',
    'Gaming',
    'News'
  ]

  for (const tagName of sampleTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    })
  }

  console.log('✅ Sample tags created')
  console.log('🎉 Production database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })