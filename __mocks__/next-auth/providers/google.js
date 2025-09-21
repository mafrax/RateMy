// Mock for next-auth/providers/google
const mockGoogleProvider = jest.fn(() => ({
  id: 'google',
  name: 'Google', 
  type: 'oauth',
  authorization: {},
  token: {},
  userinfo: {},
  profile: jest.fn()
}))

module.exports = {
  default: mockGoogleProvider,
  GoogleProvider: mockGoogleProvider
}