// Mock for next-auth main module
const mockNextAuth = {
  default: jest.fn(() => ({
    providers: [],
    callbacks: {},
    pages: {},
    session: { strategy: 'jwt' }
  })),
  getServerSession: jest.fn(),
  NextAuth: jest.fn(() => ({
    providers: [],
    callbacks: {},
    pages: {},
    session: { strategy: 'jwt' }
  }))
}

module.exports = mockNextAuth