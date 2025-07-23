import { config } from './config'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  [key: string]: any
}

export interface Logger {
  error(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
}

class ConsoleLogger implements Logger {
  private level: LogLevel

  constructor(level: string) {
    this.level = this.parseLogLevel(level)
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR
      case 'warn': return LogLevel.WARN
      case 'info': return LogLevel.INFO
      case 'debug': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (context && Object.keys(context).length > 0) {
      if (config.logging.pretty) {
        return `${baseMessage}\n${JSON.stringify(context, null, 2)}`
      } else {
        return `${baseMessage} ${JSON.stringify(context)}`
      }
    }
    
    return baseMessage
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('error', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }
}

// Create singleton logger instance
export const logger: Logger = new ConsoleLogger(config.logging.level)

// Utility functions for structured logging
export function logError(error: Error, context?: LogContext) {
  logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
  })
}

export function logApiRequest(method: string, url: string, userId?: string, duration?: number) {
  logger.info('API Request', {
    method,
    url,
    userId,
    duration: duration ? `${duration}ms` : undefined,
  })
}

export function logApiError(method: string, url: string, error: Error, userId?: string) {
  logger.error('API Error', {
    method,
    url,
    userId,
    error: error.message,
    stack: error.stack,
  })
}

export function logDatabaseQuery(query: string, duration?: number, error?: Error) {
  if (error) {
    logger.error('Database Query Error', {
      query,
      duration: duration ? `${duration}ms` : undefined,
      error: error.message,
    })
  } else {
    logger.debug('Database Query', {
      query,
      duration: duration ? `${duration}ms` : undefined,
    })
  }
}

export function logUserAction(action: string, userId: string, context?: LogContext) {
  logger.info('User Action', {
    action,
    userId,
    ...context,
  })
}

export function logSystemEvent(event: string, context?: LogContext) {
  logger.info('System Event', {
    event,
    ...context,
  })
}