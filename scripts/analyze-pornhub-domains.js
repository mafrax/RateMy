#!/usr/bin/env node

/**
 * Analyze PornHub CDN Domains from CSP Violations
 * Extracts and analyzes all PornHub-related domains from error messages
 */

console.log('🔍 Analyzing PornHub CDN domains from CSP violations...\n')

// Extract domains from the provided error messages
const blockedUrls = [
  'https://pix-cdn77.phncdn.com/c6371/videos/202509/01/21136935/original_21136935.mp4/plain/ex:1:no/bg:0:0:0/rs:fit:640:360/vts:525?hash=xjPp0C0vPQPoZEyVomQ-EHn1NAs=&validto=4891363200',
  'https://ei.phncdn.com/videos/202505/23/469058345/original/(m=qXUJQK0beaAaGwObaaaa)(mh=q9ybQi3Qr66s0Bzq)0.jpg',
  'https://ei.phncdn.com/videos/202506/18/470496965/original/(m=qLLPLL0beaAaGwObaaaa)(mh=7rYMAJYhj6P6UFuI)0.jpg',
  'https://ei.phncdn.com/videos/202505/12/468561125/original/(m=qNVYMI0beaAaGwObaaaa)(mh=fincGB99eAWIn7HA)0.jpg',
  'https://ei.phncdn.com/videos/202409/09/457543151/original/(m=eaAaGwObaaaa)(mh=OVbaMRd0QXPJINOW)10.jpg',
  'https://pix-cdn77.phncdn.com/c6371/videos/202509/08/21907825/original_21907825.mov/plain/ex:1:no/bg:0:0:0/rs:fit:640:360/vts:680?hash=FZRJB_PUrCTZzBWDFE7nSwLQk6s=&validto=4891363200',
  'https://ei.phncdn.com/videos/202408/24/456900921/thumbs_20/(m=eaAaGwObaaaa)(mh=pG-JgDPU-j4uF_Ac)13.jpg',
  'https://ei.phncdn.com/videos/202408/02/456001891/original/(m=qLG5-QZbeaAaGwObaaaa)(mh=bvulI3Ehgf0DGob_)0.jpg',
  'https://pix-cdn77.phncdn.com/c6251/videos/202509/05/21626405/original/01992eed-b83f-77a3-9c46-4eb83e4b16d5.png/plain/rs:fit:640:360?hash=cfuoRDIISVwvlcxrnL5c0QM0Tu0=&validto=4891363200',
  'https://pix-cdn77.phncdn.com/c6371/videos/202509/13/22605515/original_22605515.mp4/plain/ex:1:no/bg:0:0:0/rs:fit:640:360/vts:635?hash=P0ukuN1wHQ4g4SRRM0PtaqvZ7Jo=&validto=4891363200'
]

// Extract unique domains
const domains = new Set()
const domainAnalysis = {}

blockedUrls.forEach(url => {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    domains.add(domain)
    
    if (!domainAnalysis[domain]) {
      domainAnalysis[domain] = {
        count: 0,
        examples: [],
        patterns: new Set()
      }
    }
    
    domainAnalysis[domain].count++
    if (domainAnalysis[domain].examples.length < 2) {
      domainAnalysis[domain].examples.push(url)
    }
    
    // Analyze path patterns
    const pathParts = urlObj.pathname.split('/')
    if (pathParts.length > 1) {
      domainAnalysis[domain].patterns.add(pathParts[1]) // First path segment
    }
  } catch (e) {
    console.log('❌ Invalid URL:', url)
  }
})

console.log('📊 PornHub CDN Domain Analysis:')
console.log('================================\n')

// Sort domains by frequency
const sortedDomains = Object.entries(domainAnalysis)
  .sort(([,a], [,b]) => b.count - a.count)

sortedDomains.forEach(([domain, info]) => {
  console.log(`🌐 ${domain}`)
  console.log(`   Occurrences: ${info.count}`)
  console.log(`   Patterns: ${Array.from(info.patterns).join(', ')}`)
  console.log(`   Example: ${info.examples[0]?.substring(0, 80)}...`)
  console.log('')
})

console.log('🎯 Required CSP Additions:')
console.log('===========================\n')

const uniqueDomains = Array.from(domains).sort()
console.log('img-src additions needed:')
uniqueDomains.forEach(domain => {
  console.log(`✅ https://${domain}`)
})

console.log('\n🔧 Complete PornHub CDN Coverage:')
console.log('==================================')

const allPornHubDomains = [
  '*.pornhub.com',      // Main site
  '*.phncdn.com',       // General CDN wildcard
  'ei.phncdn.com',      // Image CDN
  'pix-cdn77.phncdn.com', // Video thumbnail CDN
  'ew.phncdn.com',      // Video CDN (from earlier error)
]

console.log('\nRecommended CSP img-src additions:')
allPornHubDomains.forEach(domain => {
  console.log(`https://${domain}`)
})

console.log('\n📝 Summary:')
console.log('===========')
console.log(`• Found ${domains.size} unique PornHub CDN domains`)
console.log(`• Total blocked requests: ${blockedUrls.length}`)
console.log(`• Main CDN patterns: ei.phncdn.com (images), pix-cdn77.phncdn.com (thumbnails)`)
console.log(`• Wildcard *.phncdn.com should cover most, but specific domains needed for compatibility`)

console.log('\n🚀 Action Required:')
console.log('===================')
console.log('1. Add the identified domains to CSP img-src directive')
console.log('2. Restart the development server')
console.log('3. Test image loading in the application')
console.log('4. Monitor for any remaining violations')

console.log('')