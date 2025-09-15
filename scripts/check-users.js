#!/usr/bin/env node

/**
 * Simple script to check existing users in the database
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        _count: {
          select: {
            videos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📋 Users in database:')
    console.log('=====================')
    
    if (users.length === 0) {
      console.log('❌ No users found. You need to create an account first.')
      console.log('\nOptions:')
      console.log('1. Visit http://localhost:3000/auth/register')
      console.log('2. Use the registration API')
    } else {
      users.forEach(user => {
        console.log(`✅ ${user.email}`)
        console.log(`   Username: ${user.username}`)
        console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`)
        console.log(`   Videos: ${user._count.videos}`)
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
        console.log('')
      })
      
      console.log(`\nTotal users: ${users.length}`)
      console.log('\n💡 Use any of these email addresses with their password for the upload script')
    }
  } catch (error) {
    console.error('❌ Error checking users:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()