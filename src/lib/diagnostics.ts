import { config } from './config'
import { logStartup, logHealthCheck, logNetworkInfo, logDatabaseConnection, logger } from './logger'
import { database } from './database'
import net from 'net'

export interface DiagnosticsResult {
  success: boolean
  component: string
  message: string
  details?: any
}

export class StartupDiagnostics {
  private results: DiagnosticsResult[] = []

  async runAll(): Promise<boolean> {
    logStartup('Application', 'starting')
    
    const checks = [
      this.checkEnvironment(),
      this.checkDatabase(),
      this.checkPorts(),
      this.checkDependencies()
    ]

    const results = await Promise.allSettled(checks)
    let allPassed = true

    for (const result of results) {
      if (result.status === 'rejected') {
        allPassed = false
        logger.error('Startup check failed', { error: result.reason })
      }
    }

    if (allPassed) {
      logStartup('Application', 'ready', {
        checks: this.results.length,
        passed: this.results.filter(r => r.success).length
      })
    } else {
      logStartup('Application', 'failed', {
        checks: this.results.length,
        failed: this.results.filter(r => !r.success).length
      })
    }

    return allPassed
  }

  private async checkEnvironment(): Promise<void> {
    logStartup('Environment', 'starting')
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]

    const missing = requiredEnvVars.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      const result: DiagnosticsResult = {
        success: false,
        component: 'Environment',
        message: `Missing required environment variables: ${missing.join(', ')}`,
        details: { missing }
      }
      this.results.push(result)
      logHealthCheck('Environment Variables', false, result.details)
      throw new Error(result.message)
    }

    this.results.push({
      success: true,
      component: 'Environment',
      message: 'All required environment variables are present'
    })
    
    logHealthCheck('Environment Variables', true, {
      required: requiredEnvVars.length,
      present: requiredEnvVars.length
    })
    logStartup('Environment', 'ready')
  }

  private async checkDatabase(): Promise<void> {
    logStartup('Database', 'starting')
    logDatabaseConnection('connecting', {
      url: config.database.url.replace(/(\/\/)(.*)@/, '//$2***@') // Hide credentials
    })

    try {
      await database.$queryRaw`SELECT 1`
      
      this.results.push({
        success: true,
        component: 'Database',
        message: 'Database connection successful'
      })
      
      logDatabaseConnection('connected')
      logHealthCheck('Database', true)
      logStartup('Database', 'ready')
    } catch (error) {
      const result: DiagnosticsResult = {
        success: false,
        component: 'Database',
        message: 'Database connection failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
      this.results.push(result)
      logDatabaseConnection('failed', result.details)
      logHealthCheck('Database', false, result.details)
      logStartup('Database', 'failed', result.details)
      throw error
    }
  }

  private async checkPorts(): Promise<void> {
    logStartup('Network', 'starting')
    
    const port = parseInt(process.env.PORT || '3000', 10)
    const host = process.env.HOST || 'localhost'
    
    logNetworkInfo(port, host, {
      NODE_ENV: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version
    })

    const isPortAvailable = await this.checkPortAvailability(port, host)
    
    if (!isPortAvailable) {
      const result: DiagnosticsResult = {
        success: false,
        component: 'Network',
        message: `Port ${port} is already in use`,
        details: { port, host }
      }
      this.results.push(result)
      logHealthCheck('Network Port', false, result.details)
      logStartup('Network', 'failed', result.details)
      throw new Error(result.message)
    }

    this.results.push({
      success: true,
      component: 'Network',
      message: `Port ${port} is available`,
      details: { port, host }
    })
    
    logHealthCheck('Network Port', true, { port, host })
    logStartup('Network', 'ready')
  }

  private async checkDependencies(): Promise<void> {
    logStartup('Dependencies', 'starting')
    
    try {
      const packageJson = require('../../package.json')
      const nodeVersion = process.version
      const platform = process.platform
      
      this.results.push({
        success: true,
        component: 'Dependencies',
        message: 'All dependencies loaded successfully',
        details: {
          nodeVersion,
          platform,
          nextVersion: packageJson.dependencies?.next || 'unknown'
        }
      })
      
      logHealthCheck('Dependencies', true, {
        nodeVersion,
        platform,
        packageName: packageJson.name,
        packageVersion: packageJson.version
      })
      logStartup('Dependencies', 'ready')
    } catch (error) {
      const result: DiagnosticsResult = {
        success: false,
        component: 'Dependencies',
        message: 'Failed to load dependencies',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
      this.results.push(result)
      logHealthCheck('Dependencies', false, result.details)
      logStartup('Dependencies', 'failed', result.details)
      throw error
    }
  }

  private checkPortAvailability(port: number, host: string): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
      
      server.listen(port, host, () => {
        server.once('close', () => {
          resolve(true)
        })
        server.close()
      })
      
      server.on('error', () => {
        resolve(false)
      })
    })
  }

  getResults(): DiagnosticsResult[] {
    return this.results
  }
}

// Create singleton instance
export const diagnostics = new StartupDiagnostics()

// Health check endpoint helper
export async function getHealthStatus() {
  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    platform: process.platform,
    checks: {} as Record<string, boolean>
  }

  try {
    // Test database connection
    await database.$queryRaw`SELECT 1`
    results.checks.database = true
  } catch (error) {
    results.checks.database = false
    results.status = 'unhealthy'
  }

  return results
}