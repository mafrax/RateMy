// Environment variables for testing
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db'

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'