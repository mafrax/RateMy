// Mock for next-auth/next module
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null
  },
  expires: '2024-12-31'
}

const mockNextAuthNext = {
  getServerSession: jest.fn(() => Promise.resolve(mockSession)),
  unstable_getServerSession: jest.fn(() => Promise.resolve(mockSession))
}

module.exports = mockNextAuthNext