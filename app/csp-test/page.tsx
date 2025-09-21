'use client'

import { useState, useEffect } from 'react'

export default function CSPTestPage() {
  const [cspInfo, setCSPInfo] = useState<any>(null)
  const [violations, setViolations] = useState<any[]>([])

  useEffect(() => {
    // Fetch CSP information
    fetch('/api/debug/csp-test')
      .then(res => res.json())
      .then(data => setCSPInfo(data))
      .catch(err => console.error('Failed to fetch CSP info:', err))

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      const violation = {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        originalPolicy: e.originalPolicy,
        disposition: e.disposition,
        timestamp: new Date().toISOString()
      }
      
      console.warn('CSP Violation:', violation)
      setViolations(prev => [...prev, violation])
    })
  }, [])

  const testUrls = [
    // Reddit URLs
    'https://i.redd.it/sample.jpg',
    'https://preview.redd.it/sample.jpg',
    'https://external-preview.redd.it/sample.jpg',
    
    // YouTube URLs (both domains)
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    
    // RedGifs URLs
    'https://thumbs2.redgifs.com/sample.jpg',
    
    // Imgur URLs
    'https://i.imgur.com/sample.jpg',
  ]

  const testImage = (url: string) => {
    const img = new Image()
    img.onload = () => console.log('✅ Image loaded:', url)
    img.onerror = () => console.log('❌ Image failed:', url)
    img.src = url
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          CSP Testing Page
        </h1>

        {/* CSP Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Current CSP Configuration
          </h2>
          
          {cspInfo && (
            <div className="space-y-4">
              <div>
                <strong className="text-gray-900 dark:text-white">Environment:</strong> 
                <span className="ml-2 text-gray-700 dark:text-gray-300">{cspInfo.environment}</span>
              </div>
              
              <div>
                <strong className="text-gray-900 dark:text-white">Image Sources (img-src):</strong>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {cspInfo.breakdown['img-src']?.map((src: string, i: number) => (
                    <code key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-1 rounded">
                      {src}
                    </code>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-gray-900 dark:text-white">Frame Sources (frame-src):</strong>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {cspInfo.breakdown['frame-src']?.map((src: string, i: number) => (
                    <code key={i} className="text-sm bg-gray-100 dark:bg-gray-700 p-1 rounded">
                      {src}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Images */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Image Loading Tests
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testUrls.map((url, i) => (
              <div key={i} className="border rounded p-4">
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
                  {url}
                </p>
                <img 
                  src={url} 
                  alt="Test image"
                  className="w-full h-32 object-cover bg-gray-200 dark:bg-gray-700"
                  onLoad={() => console.log('✅ Loaded:', url)}
                  onError={() => console.log('❌ Failed:', url)}
                />
                <button
                  onClick={() => testImage(url)}
                  className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Load
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* YouTube Embed Test */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            YouTube Embed Test
          </h2>
          
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full max-w-2xl mx-auto"
          />
        </div>

        {/* Violations Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            CSP Violations ({violations.length})
          </h2>
          
          {violations.length === 0 ? (
            <p className="text-green-600 dark:text-green-400">
              ✅ No CSP violations detected!
            </p>
          ) : (
            <div className="space-y-2">
              {violations.map((violation, i) => (
                <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <div className="text-sm">
                    <strong>Blocked URI:</strong> {violation.blockedURI}
                  </div>
                  <div className="text-sm">
                    <strong>Violated Directive:</strong> {violation.violatedDirective}
                  </div>
                  <div className="text-sm text-gray-500">
                    {violation.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Open browser console to see detailed loading results and any CSP violations.
          </p>
        </div>
      </div>
    </div>
  )
}