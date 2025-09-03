const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // Handle module aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
    '^next-auth/(.*)$': '<rootDir>/__mocks__/next-auth/$1.js',
  },
  
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  
  // Ignore Playwright tests
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/',
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|openid-client|next-auth)/)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    'pages/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/prisma/**',
  ],
  
  
  // Setup files
  setupFiles: ['<rootDir>/jest.setup.env.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)