// Mock for next-auth/providers/credentials
const mockProviders = {
  credentials: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
    credentials: {},
    authorize: jest.fn()
  })),
  google: jest.fn(() => ({
    id: 'google', 
    name: 'Google',
    type: 'oauth',
    authorization: {},
    token: {},
    userinfo: {},
    profile: jest.fn()
  })),
  github: jest.fn(() => ({
    id: 'github',
    name: 'GitHub', 
    type: 'oauth',
    authorization: {},
    token: {},
    userinfo: {},
    profile: jest.fn()
  }))
}

module.exports = mockProviders