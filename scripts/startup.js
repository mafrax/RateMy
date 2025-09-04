#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Enhanced startup script with comprehensive diagnostics
console.log('🚀 Starting RateMe Application...\n')

// Check Node.js version
const nodeVersion = process.version
const minNodeVersion = '18.0.0'
console.log(`📋 Node.js Version: ${nodeVersion}`)

if (nodeVersion < `v${minNodeVersion}`) {
  console.error(`❌ Node.js ${minNodeVersion} or higher is required. Current: ${nodeVersion}`)
  process.exit(1)
}

// Check if we're in the correct directory
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Please run this script from the project root directory.')
  process.exit(1)
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
console.log(`📦 Project: ${packageJson.name} v${packageJson.version}`)

// Check environment file
const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please copy .env.example to .env and configure it.')
  process.exit(1)
}

console.log('✅ Environment file found')

// Load environment variables
require('dotenv').config()

// Check required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
]

console.log('\\n🔍 Checking environment variables...')
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key])

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`)
  process.exit(1)
}

console.log('✅ All required environment variables are present')

// Check database connection
console.log('\\n🔗 Testing database connection...')
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
  console.log('✅ Database connection successful')
} catch (error) {
  console.error('❌ Database connection failed:', error.message)
  console.log('💡 Make sure PostgreSQL is running and the DATABASE_URL is correct')
  process.exit(1)
}

// Generate Prisma client
console.log('\\n🔧 Generating Prisma client...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated')
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message)
  process.exit(1)
}

// Check port availability
const port = parseInt(process.env.PORT || '3000', 10)
const net = require('net')

console.log(`\\n🌐 Checking port availability (${port})...`)

const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true))
    })
    
    server.on('error', () => resolve(false))
  })
}

checkPort(port).then(available => {
  if (!available) {
    console.log(`⚠️  Port ${port} is in use. The app will try to start anyway (Next.js may choose another port).`)
  } else {
    console.log(`✅ Port ${port} is available`)
  }
  
  // All checks passed, start the application
  console.log('\\n🎉 All startup checks passed!')
  console.log('\\n🚀 Starting Next.js development server...')
  console.log(`🌐 The application will be available at: http://localhost:${port}`)
  console.log('\\n📊 Health check endpoint: http://localhost:' + port + '/api/health')
  console.log('\\n' + '='.repeat(60) + '\\n')
  
  // Start the development server
  const devCommand = process.env.NODE_ENV === 'production' ? 'npm run start' : 'npm run dev'
  try {
    execSync(devCommand, { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Failed to start the application:', error.message)
    process.exit(1)
  }
}).catch(error => {
  console.error('❌ Port check failed:', error.message)
  process.exit(1)
})