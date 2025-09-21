import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  Toaster: () => null,
}))

// Mock secrets manager
jest.mock('./src/lib/secrets', () => ({
  secretsManager: {
    get: jest.fn((key) => {
      const mockSecrets = {
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/testdb',
        'NEXTAUTH_SECRET': 'test-secret-32-characters-long-12345',
        'NEXTAUTH_URL': 'http://localhost:3000'
      }
      return mockSecrets[key]
    }),
    getRequired: jest.fn((key) => {
      const mockSecrets = {
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/testdb',
        'NEXTAUTH_SECRET': 'test-secret-32-characters-long-12345',
        'NEXTAUTH_URL': 'http://localhost:3000'
      }
      return mockSecrets[key] || 'mock-value'
    }),
    has: jest.fn(() => true),
    initialize: jest.fn().mockResolvedValue(undefined)
  },
  getSecret: jest.fn((key) => {
    const mockSecrets = {
      'REDIS_URL': null,
      'SENTRY_DSN': null
    }
    return mockSecrets[key]
  }),
  getRequiredSecret: jest.fn((key) => {
    const mockSecrets = {
      'DATABASE_URL': 'postgresql://test:test@localhost:5432/testdb',
      'NEXTAUTH_SECRET': 'test-secret-32-characters-long-12345',
      'NEXTAUTH_URL': 'http://localhost:3000'
    }
    return mockSecrets[key] || 'mock-value'
  }),
  initializeSecrets: jest.fn().mockResolvedValue(undefined)
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})