#!/usr/bin/env node

/**
 * Verify CSP Fix for YouTube Images
 * Checks if the middleware contains the correct YouTube image domains
 */

const fs = require('fs')
const path = require('path')

const middlewarePath = path.join(__dirname, '..', 'middleware.ts')

console.log('🔍 Verifying CSP fix for YouTube images...\n')

try {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
  
  // Extract CSP configuration
  const cspMatch = middlewareContent.match(/img-src[^"]+/g)
  
  if (!cspMatch) {
    console.log('❌ Could not find img-src directive in middleware')
    process.exit(1)
  }
  
  const imgSrcPolicy = cspMatch[0]
  console.log('📋 Current img-src policy:')
  console.log(imgSrcPolicy)
  console.log('')
  
  // Test URLs that were being blocked
  const blockedUrls = [
    'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg'
  ]
  
  // Check if the policy would allow these URLs
  console.log('🧪 Testing blocked URLs...\n')
  
  let allPassed = true
  
  blockedUrls.forEach((url, index) => {
    const urlObj = new URL(url)
    const domain = `https://${urlObj.hostname}`
    
    // Check if the domain is allowed by our CSP
    const isAllowed = 
      imgSrcPolicy.includes('https://img.youtube.com') ||
      imgSrcPolicy.includes('https://*.youtube.com') ||
      imgSrcPolicy.includes(domain)
    
    if (isAllowed) {
      console.log(`✅ ${index + 1}. ${url}`)
      console.log(`   Domain: ${domain} - ALLOWED`)
    } else {
      console.log(`❌ ${index + 1}. ${url}`)
      console.log(`   Domain: ${domain} - BLOCKED`)
      allPassed = false
    }
    console.log('')
  })
  
  // Summary
  if (allPassed) {
    console.log('🎉 SUCCESS: All YouTube image URLs should now be allowed!')
    console.log('')
    console.log('📝 Changes made:')
    console.log('   • Added https://img.youtube.com to img-src')
    console.log('   • Added https://*.youtube.com to img-src')
    console.log('   • Kept existing https://*.ytimg.com for compatibility')
    console.log('')
    console.log('🔄 Next steps:')
    console.log('   1. Restart the development server: npm run dev')
    console.log('   2. Test the images in the browser')
    console.log('   3. Check browser console for any remaining violations')
    console.log('   4. Visit /csp-test to verify interactively')
  } else {
    console.log('❌ ISSUE: Some URLs are still not covered by the CSP policy')
    console.log('')
    console.log('🔧 Required changes:')
    console.log('   • Ensure https://img.youtube.com is in img-src')
    console.log('   • Ensure https://*.youtube.com is in img-src')
  }
  
} catch (error) {
  console.error('❌ Error reading middleware file:', error.message)
  process.exit(1)
}

console.log('')