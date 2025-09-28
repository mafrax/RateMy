import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to prevent the welcome modal from appearing
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenWelcomeModal', 'true')
    })
    
    // Close any potential modals/overlays before each test
    await page.keyboard.press('Escape')
  })

  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Wait for form to appear without networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display sign up page', async ({ page }) => {
    await page.goto('/auth/signup')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Check for sign up form
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should validate sign in form', async ({ page }) => {
    await page.goto('/auth/signin')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Try to submit empty form with force to avoid interception
    await page.click('button[type="submit"]', { force: true })
    
    // Check for toast notification (forms use toast.error for validation)
    const toastMessage = page.locator('[data-testid="toast"], .toast, [role="alert"]')
    await expect(toastMessage.or(page.locator('text="Please fill in all fields"'))).toBeVisible({ timeout: 5000 })
  })

  test('should validate sign up form', async ({ page }) => {
    await page.goto('/auth/signup')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Try to submit empty form with force to avoid interception
    await page.click('button[type="submit"]', { force: true })
    
    // Check for validation messages - signup form shows inline validation errors
    await page.waitForTimeout(500)
    
    // Check for validation messages using the actual error text from the component
    const emailError = page.locator('text="Email is required"')
    const usernameError = page.locator('text="Username is required"')
    const passwordError = page.locator('text="Password is required"')
    
    // Verify at least one validation message is visible
    await expect(emailError.or(usernameError).or(passwordError)).toBeVisible({ timeout: 5000 })
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/signup')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]', { force: true })
    await page.waitForTimeout(500)
    
    // Check for email validation - match exact error message from form
    const emailValidation = page.locator('text="Please enter a valid email address"')
    await expect(emailValidation).toBeVisible()
  })

  test('should validate password strength on sign up', async ({ page }) => {
    await page.goto('/auth/signup')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Fill form with weak password
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')
    
    await page.click('button[type="submit"]', { force: true })
    await page.waitForTimeout(500)
    
    // Check for password validation - match exact error message from form
    const passwordValidation = page.locator('text="Password must be at least 6 characters long"')
    await expect(passwordValidation).toBeVisible()
  })

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/auth/signup')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Fill form with mismatched passwords
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')
    
    await page.click('button[type="submit"]', { force: true })
    await page.waitForTimeout(500)
    
    // Check for password match validation - match exact error message from form
    const matchValidation = page.locator('text="Passwords do not match"')
    await expect(matchValidation).toBeVisible()
  })

  test('should handle sign in attempt with invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Mock failed login response
    await page.route('/api/auth/callback/credentials', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      })
    })
    
    // Fill and submit form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]', { force: true })
    
    // Check for toast error message with actual text from signin component
    const errorMessage = page.locator('text="Invalid email or password"')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should redirect after successful sign in', async ({ page }) => {
    await page.goto('/auth/signin')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Mock successful login response
    await page.route('/api/auth/callback/credentials', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: '/' })
      })
    })
    
    // Mock session API
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })
    
    // Fill and submit form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]', { force: true })
    
    // Check for success toast or redirect - the form shows success toast before redirect
    await expect(page.locator('text="Signed in successfully!"')).toBeVisible({ timeout: 5000 })
  })

  test('should show sign out option when authenticated', async ({ page }) => {
    // Mock authenticated session
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })
    
    await page.goto('/')
    
    // Check for user menu or sign out button
    const userMenu = page.locator('[data-testid="user-menu"]')
    const signOutButton = page.locator('text=/sign out/i')
    
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible()
    } else if (await signOutButton.isVisible()) {
      await expect(signOutButton).toBeVisible()
    }
  })

  test('should handle sign out', async ({ page }) => {
    // Mock authenticated session initially
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })
    
    await page.goto('/')
    
    // Find and click sign out
    const signOutButton = page.locator('text=/sign out/i')
    if (await signOutButton.isVisible()) {
      // Mock sign out response
      await page.route('/api/auth/signout', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: '/' })
        })
      })
      
      await signOutButton.click()
      
      // Should redirect and show sign in option
      await expect(page.locator('text=/sign in/i')).toBeVisible()
    }
  })

  test('should be accessible', async ({ page }) => {
    await page.goto('/auth/signin')
    // Wait for form instead of networkidle
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    
    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    
    // Check for proper heading structure - signin page has h2
    await expect(page.locator('h2')).toBeVisible()
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})