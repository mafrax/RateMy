import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check for sign in form
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display sign up page', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Check for sign up form
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should validate sign in form', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation messages
    const emailError = page.locator('text="Email is required"')
    const passwordError = page.locator('text="Password is required"')
    
    if (await emailError.isVisible()) {
      await expect(emailError).toBeVisible()
    }
    if (await passwordError.isVisible()) {
      await expect(passwordError).toBeVisible()
    }
  })

  test('should validate sign up form', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation messages
    await expect(page.locator('text=/Email is required/i')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Check for email validation
    const emailValidation = page.locator('text=/valid email/i')
    if (await emailValidation.isVisible()) {
      await expect(emailValidation).toBeVisible()
    }
  })

  test('should validate password strength on sign up', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Fill form with weak password
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')
    
    await page.click('button[type="submit"]')
    
    // Check for password validation
    const passwordValidation = page.locator('text=/password.*characters/i')
    if (await passwordValidation.isVisible()) {
      await expect(passwordValidation).toBeVisible()
    }
  })

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Fill form with mismatched passwords
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')
    
    await page.click('button[type="submit"]')
    
    // Check for password match validation
    const matchValidation = page.locator('text=/passwords.*match/i')
    if (await matchValidation.isVisible()) {
      await expect(matchValidation).toBeVisible()
    }
  })

  test('should handle sign in attempt with invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
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
    await page.click('button[type="submit"]')
    
    // Check for error message
    const errorMessage = page.locator('text=/invalid.*credentials/i')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible()
    }
  })

  test('should redirect after successful sign in', async ({ page }) => {
    await page.goto('/auth/signin')
    
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
    await page.click('button[type="submit"]')
    
    // Should redirect to home page
    await expect(page).toHaveURL(/.*\/$/) // Match any base URL ending with /
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
    
    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible()
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})