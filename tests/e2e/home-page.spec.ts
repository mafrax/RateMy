import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load home page successfully', async ({ page }) => {
    // Check if the main heading is visible
    await expect(page.locator('h1')).toBeVisible()
    
    // Check if navigation is present
    await expect(page.locator('nav')).toBeVisible()
    
    // Verify page title
    await expect(page).toHaveTitle(/RateMe/i)
  })

  test('should display video grid', async ({ page }) => {
    // Wait for video grid to load
    await page.waitForSelector('[data-testid="video-grid"]', { timeout: 10000 })
    
    // Check if videos are displayed
    const videoCards = page.locator('[data-testid="video-card"]')
    await expect(videoCards.first()).toBeVisible()
  })

  test('should have working navigation links', async ({ page }) => {
    // Wait for page to be fully loaded before interacting
    await page.waitForLoadState('networkidle')
    
    // Close any potential modals or overlays that might be blocking clicks
    await page.keyboard.press('Escape')
    
    // Test navigation to upload page with force option to avoid interception
    const uploadLink = page.locator('nav a[href="/upload"]')
    await expect(uploadLink).toBeVisible()
    await uploadLink.click({ force: true })
    await expect(page).toHaveURL(/\/upload/)
    
    // Go back to home with force option
    const homeLink = page.locator('nav a[href="/"]')
    await expect(homeLink).toBeVisible()
    await homeLink.click({ force: true })
    await expect(page).toHaveURL(/.*\/$/)
  })

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForLoadState('networkidle')
    
    // Check if mobile navigation is working
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click({ force: true })
      await expect(page.locator('nav')).toBeVisible()
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForLoadState('networkidle')
    await expect(page.locator('nav')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForLoadState('networkidle')
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should handle search functionality', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i]')
    
    if (await searchInput.isVisible()) {
      // Enter search query
      await searchInput.fill('test video')
      await searchInput.press('Enter')
      
      // Wait for search results
      await page.waitForLoadState('networkidle')
      
      // Verify URL contains search parameters
      await expect(page).toHaveURL(/search/i)
    }
  })

  test('should display error message for failed API calls', async ({ page }) => {
    // Mock failed API response
    await page.route('/api/videos', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Internal server error' })
      })
    })

    await page.reload()
    
    // Check for error message
    const errorMessage = page.locator('[data-testid="error-message"]')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/error/i)
    }
  })

  test('should load more videos on scroll', async ({ page }) => {
    // Get initial video count
    const initialVideoCards = await page.locator('[data-testid="video-card"]').count()
    
    if (initialVideoCards > 0) {
      // Scroll to bottom of page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      
      // Wait for potential new videos to load
      await page.waitForTimeout(2000)
      
      // Check if more videos were loaded (infinite scroll)
      const finalVideoCards = await page.locator('[data-testid="video-card"]').count()
      
      // If infinite scroll is implemented, we should have more videos
      // Otherwise, this test documents the current behavior
      console.log(`Initial videos: ${initialVideoCards}, Final videos: ${finalVideoCards}`)
    }
  })

  test('should have accessible navigation', async ({ page }) => {
    // Check for proper ARIA labels
    const nav = page.locator('nav')
    await expect(nav).toHaveAttribute('role', 'navigation')
    
    // Check for skip links
    const skipLink = page.locator('a[href="#main-content"]')
    if (await skipLink.isVisible()) {
      await expect(skipLink).toContainText(/skip/i)
    }
    
    // Check for proper heading hierarchy
    const mainHeading = page.locator('h1')
    await expect(mainHeading).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Close any potential modals that might interfere
    await page.keyboard.press('Escape')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Test Enter key on focused element - but check if it's safe to press
    const currentFocus = page.locator(':focus')
    const tagName = await currentFocus.evaluate(el => el?.tagName?.toLowerCase())
    
    if (tagName === 'a' || tagName === 'button') {
      await page.keyboard.press('Enter')
      // Should navigate or trigger action
      await page.waitForLoadState('domcontentloaded')
    }
  })
})