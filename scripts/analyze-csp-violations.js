#!/usr/bin/env node

/**
 * CSP Violation Analysis Tool
 * Analyzes CSP violations and suggests policy updates
 */

const fs = require('fs')
const path = require('path')

// Sample CSP violations for analysis (would come from logs in production)
const sampleViolations = [
  {
    'document-uri': 'http://localhost:3000/',
    'violated-directive': 'img-src',
    'blocked-uri': 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    'effective-directive': 'img-src',
  },
  {
    'document-uri': 'http://localhost:3000/',
    'violated-directive': 'frame-src',
    'blocked-uri': 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'effective-directive': 'frame-src',
  },
  {
    'document-uri': 'http://localhost:3000/',
    'violated-directive': 'script-src',
    'blocked-uri': 'https://www.googletagmanager.com/gtag/js',
    'effective-directive': 'script-src',
  },
]

// Known safe domains for different directives
const safeDomains = {
  'img-src': [
    'https://*.ytimg.com',
    'https://*.googleusercontent.com',
    'https://*.ggpht.com',
    'https://i.imgur.com',
    'https://*.imgur.com',
    'https://i.redd.it',
    'https://*.redditmedia.com',
    'https://*.redgifs.com',
    'https://*.pornhub.com',
    'https://*.xhamster.com',
  ],
  'frame-src': [
    'https://www.youtube.com',
    'https://youtube.com',
    'https://www.youtube-nocookie.com',
    'https://www.redgifs.com',
    'https://redgifs.com',
    'https://www.pornhub.com',
    'https://pornhub.com',
  ],
  'script-src': [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://www.youtube.com',
    'https://*.youtube.com',
  ],
  'connect-src': [
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://region1.google-analytics.com',
    'https://www.youtube.com',
    'https://*.youtube.com',
    'https://www.googleapis.com',
    'https://api.redgifs.com',
    'https://www.reddit.com',
  ],
  'media-src': [
    'https://*.youtube.com',
    'https://*.googlevideo.com',
    'https://*.redgifs.com',
    'https://*.pornhub.com',
    'https://*.xhamster.com',
    'https://v.redd.it',
  ],
}

// Analyze violations and suggest fixes
function analyzeViolations(violations) {
  const analysis = {
    totalViolations: violations.length,
    violationsByDirective: {},
    suggestedAdditions: {},
    potentialThreats: [],
  }

  violations.forEach(violation => {
    const directive = violation['violated-directive']
    const blockedUri = violation['blocked-uri']

    // Count violations by directive
    if (!analysis.violationsByDirective[directive]) {
      analysis.violationsByDirective[directive] = 0
    }
    analysis.violationsByDirective[directive]++

    // Analyze blocked URI
    if (blockedUri && blockedUri !== 'eval' && blockedUri !== 'inline') {
      const domain = extractDomain(blockedUri)
      
      if (isSafeDomain(domain, directive)) {
        // Suggest addition to CSP
        if (!analysis.suggestedAdditions[directive]) {
          analysis.suggestedAdditions[directive] = new Set()
        }
        analysis.suggestedAdditions[directive].add(domain)
      } else {
        // Flag as potential threat
        analysis.potentialThreats.push({
          directive,
          blockedUri,
          domain,
          reason: 'Unknown domain - manual review required'
        })
      }
    }
  })

  // Convert Sets to Arrays for JSON serialization
  Object.keys(analysis.suggestedAdditions).forEach(directive => {
    analysis.suggestedAdditions[directive] = Array.from(analysis.suggestedAdditions[directive])
  })

  return analysis
}

// Extract domain from URI
function extractDomain(uri) {
  try {
    const url = new URL(uri)
    return `${url.protocol}//${url.hostname}`
  } catch (e) {
    return uri
  }
}

// Check if domain is in safe list
function isSafeDomain(domain, directive) {
  const safeDomainList = safeDomains[directive] || []
  
  return safeDomainList.some(safeDomain => {
    if (safeDomain.includes('*')) {
      // Handle wildcard domains
      const pattern = safeDomain.replace(/\*/g, '.*')
      const regex = new RegExp(pattern)
      return regex.test(domain)
    } else {
      return domain === safeDomain
    }
  })
}

// Generate CSP policy updates
function generateCSPUpdates(analysis) {
  const updates = {}
  
  Object.entries(analysis.suggestedAdditions).forEach(([directive, domains]) => {
    if (domains.length > 0) {
      updates[directive] = domains
    }
  })
  
  return updates
}

// Generate report
function generateReport(analysis) {
  const report = []
  
  report.push('# CSP Violation Analysis Report')
  report.push('')
  report.push(`**Total Violations:** ${analysis.totalViolations}`)
  report.push('')
  
  // Violations by directive
  report.push('## Violations by Directive')
  report.push('')
  Object.entries(analysis.violationsByDirective).forEach(([directive, count]) => {
    report.push(`- **${directive}:** ${count} violations`)
  })
  report.push('')
  
  // Suggested additions
  if (Object.keys(analysis.suggestedAdditions).length > 0) {
    report.push('## Suggested CSP Policy Updates')
    report.push('')
    report.push('Add the following domains to your CSP:')
    report.push('')
    
    Object.entries(analysis.suggestedAdditions).forEach(([directive, domains]) => {
      if (domains.length > 0) {
        report.push(`### ${directive}`)
        domains.forEach(domain => {
          report.push(`- \`${domain}\``)
        })
        report.push('')
      }
    })
  }
  
  // Potential threats
  if (analysis.potentialThreats.length > 0) {
    report.push('## Potential Security Threats')
    report.push('')
    report.push('The following domains require manual review:')
    report.push('')
    
    analysis.potentialThreats.forEach(threat => {
      report.push(`- **${threat.directive}:** \`${threat.domain}\``)
      report.push(`  - Blocked URI: \`${threat.blockedUri}\``)
      report.push(`  - Reason: ${threat.reason}`)
      report.push('')
    })
  }
  
  // Recommendations
  report.push('## Recommendations')
  report.push('')
  report.push('1. **Review suggested additions** and add safe domains to your CSP policy')
  report.push('2. **Investigate potential threats** manually before adding them')
  report.push('3. **Monitor CSP violations** regularly to catch new issues')
  report.push('4. **Test CSP changes** in staging before deploying to production')
  report.push('5. **Use CSP report-only mode** when testing new policies')
  report.push('')
  
  return report.join('\n')
}

// Main function
function main() {
  console.log('🔍 Analyzing CSP violations...\n')
  
  // In a real scenario, you would load violations from logs or database
  const violations = sampleViolations
  
  if (violations.length === 0) {
    console.log('✅ No CSP violations found!')
    return
  }
  
  // Analyze violations
  const analysis = analyzeViolations(violations)
  
  // Generate updates
  const updates = generateCSPUpdates(analysis)
  
  // Generate report
  const report = generateReport(analysis)
  
  // Display results
  console.log('📊 Analysis Results:')
  console.log('===================')
  console.log(`Total violations: ${analysis.totalViolations}`)
  console.log('Violations by directive:', analysis.violationsByDirective)
  console.log('')
  
  if (Object.keys(updates).length > 0) {
    console.log('🔧 Suggested CSP Updates:')
    console.log('=========================')
    Object.entries(updates).forEach(([directive, domains]) => {
      console.log(`${directive}:`)
      domains.forEach(domain => console.log(`  + ${domain}`))
    })
    console.log('')
  }
  
  if (analysis.potentialThreats.length > 0) {
    console.log('⚠️  Potential Threats (Manual Review Required):')
    console.log('==============================================')
    analysis.potentialThreats.forEach(threat => {
      console.log(`${threat.directive}: ${threat.domain}`)
      console.log(`  URI: ${threat.blockedUri}`)
      console.log(`  Reason: ${threat.reason}`)
    })
    console.log('')
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'csp-analysis-report.md')
  fs.writeFileSync(reportPath, report)
  console.log(`📄 Full report saved to: ${reportPath}`)
  
  // Generate CSP config update
  if (Object.keys(updates).length > 0) {
    const configUpdate = generateConfigUpdate(updates)
    const configPath = path.join(__dirname, '..', 'csp-config-update.json')
    fs.writeFileSync(configPath, JSON.stringify(configUpdate, null, 2))
    console.log(`⚙️  CSP config update saved to: ${configPath}`)
  }
}

// Generate configuration update file
function generateConfigUpdate(updates) {
  return {
    timestamp: new Date().toISOString(),
    description: 'CSP policy updates based on violation analysis',
    updates: updates,
    instructions: [
      '1. Review each suggested addition carefully',
      '2. Add approved domains to src/lib/security-headers.ts',
      '3. Test changes in staging environment',
      '4. Deploy to production after verification'
    ]
  }
}

// Run the analysis
if (require.main === module) {
  main()
}

module.exports = {
  analyzeViolations,
  generateCSPUpdates,
  generateReport,
}