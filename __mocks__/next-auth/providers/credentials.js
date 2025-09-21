// Mock for next-auth/providers/credentials
const mockCredentialsProvider = jest.fn(() => ({
  id: 'credentials',
  name: 'Credentials',
  type: 'credentials',
  credentials: {},
  authorize: jest.fn()
}))

module.exports = {
  default: mockCredentialsProvider,
  CredentialsProvider: mockCredentialsProvider
}