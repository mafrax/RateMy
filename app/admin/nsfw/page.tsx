'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface NSFWStats {
  total: number
  nsfwCount: number
  safeCount: number
  percentage: number
}

export default function NSFWAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<NSFWStats | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<{ scanned: number, updated: number } | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Load NSFW stats
  const loadStats = async () => {
    try {
      const response = await fetch('/api/nsfw/stats')
      if (!response.ok) {
        throw new Error('Failed to load stats')
      }
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error loading NSFW stats:', error)
      toast.error('Failed to load NSFW statistics')
    }
  }

  // Run bulk NSFW scan
  const runBulkScan = async () => {
    if (!session?.user) return

    setIsScanning(true)
    setScanResults(null)
    
    try {
      const response = await fetch('/api/nsfw/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to run bulk scan')
      }

      const data = await response.json()
      setScanResults(data.data)
      toast.success(`Bulk scan completed! Scanned ${data.data.scanned} videos, updated ${data.data.updated}`)
      
      // Reload stats
      await loadStats()
      
    } catch (error) {
      console.error('Error running bulk scan:', error)
      toast.error('Failed to run bulk scan')
    } finally {
      setIsScanning(false)
    }
  }

  // Load stats on component mount
  useEffect(() => {
    if (session?.user) {
      loadStats()
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            NSFW Content Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage NSFW content detection and classification for all videos.
          </p>
        </div>

        {/* Statistics Card */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              NSFW Statistics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Total Videos
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.nsfwCount}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  NSFW Videos
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.safeCount}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Safe Videos
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.percentage}%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  NSFW Percentage
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Bulk Actions
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Run NSFW Detection Scan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Automatically scan all videos and update their NSFW status based on title and description analysis.
                  This will only update videos where the detected status differs from the current status.
                </p>
              </div>
              <button
                onClick={runBulkScan}
                disabled={isScanning}
                className={`ml-4 px-4 py-2 rounded-md font-medium transition-colors ${
                  isScanning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isScanning ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Scanning...</span>
                  </div>
                ) : (
                  'Run Scan'
                )}
              </button>
            </div>

            {scanResults && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Scan Results
                </h3>
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p>Videos scanned: <span className="font-medium">{scanResults.scanned}</span></p>
                  <p>Videos updated: <span className="font-medium">{scanResults.updated}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detection Rules Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Detection Rules
          </h2>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <span className="font-medium">Automatic NSFW Detection</span> uses keyword matching to identify potentially explicit content.
            </p>
            <p>
              The system scans video titles and descriptions for explicit terms, body part references, action words, and other indicators of adult content.
            </p>
            <p>
              <span className="font-medium">Manual Override:</span> Users can manually mark videos as NSFW or safe using the controls on each video card.
            </p>
            <p>
              <span className="font-medium">Content Filtering:</span> Users can choose to include or exclude NSFW content from their search results using the toggle in the search filters.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}