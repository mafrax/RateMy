# 🧪 Testing Guide

## 🎯 Testing Strategy

RateMe uses a comprehensive testing approach:
- **E2E Tests**: Playwright for user workflow testing
- **Unit Tests**: Jest for individual function testing
- **Integration Tests**: API endpoint and database testing

## 🔧 Test Setup

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test database
DATABASE_URL="postgresql://user:password@localhost:5432/ratemy_test"
npm run db:migrate
```

### Browser Setup
```bash
# Install Playwright browsers
npx playwright install
```

## 🎭 E2E Testing with Playwright

### Running Tests
```bash
# Standard tests (Chromium + Firefox)
npm run test:ui

# All browsers (including WebKit if supported)
npm run test:ui:all

# Run with browser UI visible
npm run test:ui:headed

# Debug tests interactively
npm run test:ui:debug

# Run specific test file
npm run test:ui tests/e2e/auth.spec.ts

# Run specific test by name
npm run test:ui -g "should login successfully"
```

### Test Structure
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/auth/signin')
  })

  test('should login successfully', async ({ page }) => {
    // Test implementation
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/')
  })
})
```

### Current Test Coverage

#### ✅ Authentication Tests
- Sign in page display
- Sign up page display  
- Form validation (email, password, required fields)
- Invalid credentials handling
- Successful authentication flow
- Sign out functionality
- Accessibility testing

#### ✅ Home Page Tests
- Page loading and navigation
- Video grid display
- Responsive design across viewports
- Search functionality
- Navigation links
- Error handling for API failures
- Keyboard navigation
- Accessibility compliance

### Test Configuration

Located in `playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // WebKit conditionally enabled via ENABLE_WEBKIT=true
  ],
})
```

## 🚫 WebKit Compatibility

### Known Issue
WebKit tests fail with "Bus error: 10" on some macOS systems due to Playwright binary compatibility.

### Solution Implemented
- **Default**: WebKit disabled to prevent CI failures
- **Optional**: Enable with `ENABLE_WEBKIT=true npm run test:ui:webkit`
- **Primary Coverage**: Chromium and Firefox provide excellent cross-browser validation

### Commands
```bash
# Standard tests (no WebKit)
npm run test:ui

# Test WebKit specifically (if supported)
npm run test:ui:webkit

# Force all browsers
ENABLE_WEBKIT=true npm run test:ui:all
```

## 🔍 Test Debugging

### Debug Mode
```bash
# Interactive debugging
npm run test:ui:debug

# Specific test debugging
npx playwright test tests/e2e/auth.spec.ts --debug
```

### Screenshots and Videos
```bash
# Tests automatically take screenshots on failure
# Located in: test-results/

# View test reports
npx playwright show-report
```

### Trace Viewer
```bash
# Generate traces on test failures
npx playwright show-trace test-results/trace.zip
```

## 📊 Test Results

### Current Status
- **42/42 tests passing** in Chromium and Firefox
- **100% success rate** on primary browsers
- **Comprehensive coverage** of authentication and navigation

### CI Integration
Tests run automatically on:
- Every push to main branch
- All pull requests
- Manual workflow dispatch

## 🎯 Writing New Tests

### Best Practices

#### 1. Use Page Object Model
```typescript
// tests/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth/signin')
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')
  }
}
```

#### 2. Use Data Test IDs
```html
<!-- Prefer data-testid over CSS selectors -->
<button data-testid="submit-button">Submit</button>
```

```typescript
// In tests
await page.click('[data-testid="submit-button"]')
```

#### 3. Wait for Elements Properly
```typescript
// Good: Wait for specific elements
await expect(page.locator('[data-testid="video-grid"]')).toBeVisible()

// Avoid: networkidle in CI environments
// await page.waitForLoadState('networkidle') // Can timeout in CI
```

#### 4. Handle Async Operations
```typescript
// Wait for API responses
await page.waitForResponse(response => 
  response.url().includes('/api/videos') && response.status() === 200
)
```

### Test Categories

#### Authentication Tests (`auth.spec.ts`)
- User registration and login flows
- Form validation and error handling
- Session management
- Password requirements

#### Navigation Tests (`home-page.spec.ts`)
- Page routing and navigation
- Responsive design testing
- Search functionality
- Error states

#### Video Tests (to be added)
- Video upload functionality
- Video viewing and rating
- Video management features

## 🚨 Troubleshooting

### Common Issues

#### Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
timeout: 60000 // 60 seconds

# Or in specific tests
test('slow test', async ({ page }) => {
  test.setTimeout(120000) // 2 minutes
})
```

#### Element Not Found
```typescript
// Use more specific selectors
await page.locator('[data-testid="specific-element"]')

// Wait for element to be visible
await expect(page.locator('selector')).toBeVisible({ timeout: 10000 })
```

#### CI-Specific Failures
- Use element visibility instead of `networkidle`
- Add appropriate timeouts for CI environments
- Mock external API calls
- Use fixed viewport sizes

### Performance Tips
- Use `beforeEach` for common setup
- Mock external services
- Use appropriate waiting strategies
- Parallelize independent tests

## 📈 Test Metrics

### Coverage Goals
- **E2E**: All user-facing features
- **Unit**: Business logic and utilities
- **Integration**: API endpoints and database operations

### Current Metrics
- **E2E Tests**: 42 tests covering authentication and navigation
- **Success Rate**: 100% on Chromium and Firefox
- **Execution Time**: ~20-30 seconds for full suite
- **Parallel Execution**: 6 workers for optimal performance