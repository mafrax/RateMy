// Mock for next-auth/react module
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null
  },
  expires: '2024-12-31'
}

const mockNextAuthReact = {
  useSession: jest.fn(() => ({
    data: mockSession,
    status: 'authenticated',
    update: jest.fn()
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(() => Promise.resolve(mockSession)),
  getCsrfToken: jest.fn(() => Promise.resolve('mock-csrf-token')),
  getProviders: jest.fn(() => Promise.resolve({})),
  SessionProvider: ({ children }) => children
}

module.exports = mockNextAuthReact