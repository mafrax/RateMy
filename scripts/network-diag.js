#!/usr/bin/env node

const { exec } = require('child_process')
const { promisify } = require('util')
const net = require('net')
const execAsync = promisify(exec)

console.log('🌐 Network Diagnostics for RateMe Application\n')

async function runCommand(command, description) {
  console.log(`🔍 ${description}...`)
  try {
    const { stdout, stderr } = await execAsync(command)
    if (stdout.trim()) {
      console.log(`✅ ${stdout.trim()}`)
    }
    if (stderr.trim()) {
      console.log(`⚠️  ${stderr.trim()}`)
    }
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message}`)
  }
  console.log('')
}

async function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, host, () => {
      server.close(() => resolve({ available: true, host, port }))
    })
    
    server.on('error', (err) => {
      resolve({ 
        available: false, 
        host, 
        port, 
        error: err.code === 'EADDRINUSE' ? 'Port in use' : err.message 
      })
    })
  })
}

async function testConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const timeout = setTimeout(() => {
      socket.destroy()
      resolve({ success: false, error: 'Timeout' })
    }, 3000)

    socket.connect(port, host, () => {
      clearTimeout(timeout)
      socket.end()
      resolve({ success: true })
    })

    socket.on('error', (err) => {
      clearTimeout(timeout)
      resolve({ success: false, error: err.message })
    })
  })
}

async function main() {
  // System network information
  await runCommand('hostname', 'Getting hostname')
  
  if (process.platform === 'darwin') {
    await runCommand('ifconfig | grep "inet " | grep -v 127.0.0.1', 'Getting IP addresses (macOS)')
  } else if (process.platform === 'linux') {
    await runCommand('ip addr show | grep "inet " | grep -v 127.0.0.1', 'Getting IP addresses (Linux)')
  }
  
  // Check common ports
  const portsToCheck = [3000, 3001, 5432, 80, 443, 8080]
  console.log('🔍 Checking port availability...')
  
  for (const port of portsToCheck) {
    const result = await checkPort(port)
    if (result.available) {
      console.log(`✅ Port ${port}: Available`)
    } else {
      console.log(`❌ Port ${port}: ${result.error}`)
      
      // Try to find what's using the port
      try {
        if (process.platform === 'darwin') {
          const { stdout } = await execAsync(`lsof -ti:${port}`)
          if (stdout.trim()) {
            const { stdout: processInfo } = await execAsync(`ps -p ${stdout.trim()} -o comm=`)
            console.log(`   └─ Used by: ${processInfo.trim()}`)
          }
        }
      } catch (e) {
        // Ignore errors when trying to find process
      }
    }
  }
  
  console.log('')
  
  // Test database connection
  console.log('🔍 Testing database connection...')
  const dbResult = await testConnection('localhost', 5432)
  if (dbResult.success) {
    console.log('✅ PostgreSQL: Connection successful')
  } else {
    console.log(`❌ PostgreSQL: ${dbResult.error}`)
  }
  
  // Test web server connection
  console.log('\\n🔍 Testing web server connections...')
  for (const port of [3000, 3001]) {
    const webResult = await testConnection('localhost', port)
    if (webResult.success) {
      console.log(`✅ Web Server (${port}): Connection successful`)
      
      // Try HTTP request
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/api/health`, { timeout: 5000 })
        const statusCode = stdout.trim()
        if (statusCode === '200') {
          console.log(`   └─ Health check: ✅ OK (${statusCode})`)
        } else {
          console.log(`   └─ Health check: ⚠️  Status ${statusCode}`)
        }
      } catch (e) {
        console.log(`   └─ Health check: ❌ Failed to connect`)
      }
    } else {
      console.log(`❌ Web Server (${port}): ${webResult.error}`)
    }
  }
  
  // Docker diagnostics
  console.log('\\n🔍 Docker diagnostics...')
  try {
    await runCommand('docker --version', 'Docker version')
    await runCommand('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', 'Running containers')
  } catch (e) {
    console.log('❌ Docker not available or not running')
  }
  
  // DNS resolution test
  console.log('🔍 DNS resolution test...')
  await runCommand('nslookup localhost', 'Resolving localhost')
  
  console.log('\\n' + '='.repeat(60))
  console.log('🏁 Network diagnostics complete!')
  console.log('\\nIf you\'re having connection issues:')
  console.log('1. Make sure no other services are using the required ports')
  console.log('2. Check your firewall settings')
  console.log('3. Verify PostgreSQL is running (port 5432)')
  console.log('4. Try accessing http://localhost:3000/api/health')
}

main().catch(error => {
  console.error('❌ Network diagnostics failed:', error.message)
  process.exit(1)
})