'use client'

import { useState } from 'react'

export default function XHamsterDebugPage() {
  const [url, setUrl] = useState('https://fra.xhamster.com/videos/my-tight-little-pussy-gets-pounded-by-a-stranger-while-we-are-stuck-in-the-elevator-freeuse-xhAmP8O')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testUrl = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/xhamster-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ url })
      })

      const data = await response.json()
      setResult(data)
      console.log('XHamster Debug Test Result:', data)
    } catch (error) {
      console.error('Test error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          XHamster Debug Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            XHamster URL to Test:
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter XHamster URL"
          />
          <button
            onClick={testUrl}
            disabled={loading || !url}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Test URL'}
          </button>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.htmlSample && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  HTML Sample (First 3000 chars):
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-xs max-h-96">
                  {result.htmlSample}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}