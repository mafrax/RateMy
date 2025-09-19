'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { TagRatingStep } from '../../components/TagRatingStep'

export default function UploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'metadata' | 'rating'>('metadata')
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    originalUrl: '',
    description: '',
    tags: ''
  })
  const [isDetectingMetadata, setIsDetectingMetadata] = useState(false)
  const [autoDetectedData, setAutoDetectedData] = useState({
    title: '',
    description: '',
    tags: [] as string[]
  })

  // Convert various video URLs to embed URLs
  const convertToEmbedUrl = (url: string): string => {
    // YouTube URLs
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo URLs
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    // TikTok URLs
    const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/
    const tiktokMatch = url.match(tiktokRegex)
    if (tiktokMatch) {
      return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`
    }

    // Instagram URLs
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/
    const instagramMatch = url.match(instagramRegex)
    if (instagramMatch) {
      return `https://www.instagram.com/p/${instagramMatch[1]}/embed/`
    }

    // Twitter/X URLs
    const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/
    const twitterMatch = url.match(twitterRegex)
    if (twitterMatch) {
      return `https://platform.twitter.com/embed/Tweet.html?id=${twitterMatch[1]}`
    }

    // Dailymotion URLs
    const dailymotionRegex = /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)/
    const dailymotionMatch = url.match(dailymotionRegex)
    if (dailymotionMatch) {
      return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`
    }

    // RedGifs URLs
    const redgifsRegex = /(?:https?:\/\/)?(?:www\.)?redgifs\.com\/watch\/([a-zA-Z0-9]+)/
    const redgifsMatch = url.match(redgifsRegex)
    if (redgifsMatch) {
      return `https://www.redgifs.com/ifr/${redgifsMatch[1]}`
    }

    // Pornhub URLs
    const pornhubRegex = /(?:https?:\/\/)?(?:www\.)?(?:[\w]+\.)?pornhub\.com\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/
    const pornhubMatch = url.match(pornhubRegex)
    if (pornhubMatch) {
      return `https://www.pornhub.com/embed/${pornhubMatch[1]}`
    }

    // Twitch URLs
    const twitchVideoRegex = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/
    const twitchVideoMatch = url.match(twitchVideoRegex)
    if (twitchVideoMatch) {
      return `https://player.twitch.tv/?video=${twitchVideoMatch[1]}&parent=${window.location.hostname}`
    }

    const twitchClipRegex = /(?:https?:\/\/)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/
    const twitchClipMatch = url.match(twitchClipRegex)
    if (twitchClipMatch) {
      return `https://clips.twitch.tv/embed?clip=${twitchClipMatch[1]}&parent=${window.location.hostname}`
    }

    // Direct video files
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v']
    const urlPath = new URL(url).pathname.toLowerCase()
    if (videoExtensions.some(ext => urlPath.endsWith(ext))) {
      return url // Return original URL for direct video files
    }

    // If it's already an embed URL or unsupported, return as is
    return url
  }

  // Detect if URL is RedGifs and auto-fetch metadata
  const detectRedGifsMetadata = async (url: string) => {
    if (!url.includes('redgifs.com')) return

    setIsDetectingMetadata(true)
    try {
      const response = await fetch('/api/redgifs/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.metadata) {
          setAutoDetectedData({
            title: data.metadata.title || '',
            description: data.metadata.description || '',
            tags: data.metadata.tags || []
          })
          
          // Auto-fill form if fields are empty
          setFormData(prev => ({
            ...prev,
            title: prev.title || data.metadata.title || '',
            description: prev.description || data.metadata.description || '',
            tags: prev.tags || (data.metadata.tags || []).join(', ')
          }))
          
          toast.success('RedGifs metadata detected and auto-filled!')
        }
      }
    } catch (error) {
      console.error('Failed to detect RedGifs metadata:', error)
      toast.error('Failed to auto-detect metadata, but you can still upload manually')
    } finally {
      setIsDetectingMetadata(false)
    }
  }

  // Auto-detect metadata when URL changes
  useEffect(() => {
    if (formData.originalUrl && formData.originalUrl.includes('redgifs.com')) {
      const timeoutId = setTimeout(() => {
        detectRedGifsMetadata(formData.originalUrl)
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timeoutId)
    } else {
      // Clear auto-detected data if not RedGifs URL
      setAutoDetectedData({ title: '', description: '', tags: [] })
    }
  }, [formData.originalUrl])

  const handleExtractMetadata = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('Please sign in to upload videos')
      router.push('/auth/signin')
      return
    }

    if (!formData.originalUrl) {
      toast.error('Please provide a video URL')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/videos/extract-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          originalUrl: formData.originalUrl
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.metadata) {
          setExtractedMetadata({
            ...result.metadata,
            userTitle: formData.title,
            userDescription: formData.description,
            userTags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          })
          setCurrentStep('rating')
          toast.success(`Extracted ${result.metadata.tags?.length || 0} tags for rating`)
        } else {
          toast.error('Failed to extract metadata')
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to extract metadata')
      }
    } catch (error) {
      toast.error('An error occurred while extracting metadata')
      console.error('Metadata extraction error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteUpload = async (ratedTags: Array<{name: string, rating: number}>) => {
    if (!extractedMetadata) return

    setIsSubmitting(true)

    try {
      const embedUrl = convertToEmbedUrl(formData.originalUrl)
      
      // Combine user tags with rated extracted tags
      const allTags = [...extractedMetadata.userTags]
      ratedTags.forEach(tag => {
        if (tag.rating > 0 && !allTags.includes(tag.name)) {
          allTags.push(tag.name)
        }
      })

      const uploadPayload = {
        title: extractedMetadata.userTitle || extractedMetadata.title,
        originalUrl: formData.originalUrl,
        embedUrl: extractedMetadata.embedUrl || embedUrl,
        description: extractedMetadata.userDescription || extractedMetadata.description,
        tags: allTags,
        thumbnail: extractedMetadata.thumbnail,
        previewUrl: extractedMetadata.previewUrl,
        isNsfw: extractedMetadata.isNsfw,
        tagRatings: ratedTags
      }

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(uploadPayload),
      })

      if (response.ok) {
        toast.success('Video uploaded successfully!')
        // Notify SearchBar to refresh its tag list since new tags may have been created
        window.dispatchEvent(new CustomEvent('tagsUpdated'))
        router.push('/')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to upload video')
      }
    } catch (error) {
      toast.error('An error occurred while uploading')
      console.error('Upload error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToEdit = () => {
    setCurrentStep('metadata')
    setExtractedMetadata(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in to upload videos
          </p>
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/auth/signin')}
              className="btn btn-primary"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show tag rating step if metadata has been extracted
  if (currentStep === 'rating' && extractedMetadata) {
    return (
      <TagRatingStep
        extractedTags={extractedMetadata.tags || []}
        videoTitle={extractedMetadata.userTitle || extractedMetadata.title || 'Untitled Video'}
        videoThumbnail={extractedMetadata.thumbnail}
        onComplete={handleCompleteUpload}
        onBack={handleBackToEdit}
        isSubmitting={isSubmitting}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Upload Video
            </h1>
            
            <form onSubmit={handleExtractMetadata} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title <span className="text-sm text-gray-500">(optional - will be auto-extracted)</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter video title or leave empty for auto-extraction"
                />
              </div>

              {/* Video URL */}
              <div>
                <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL *
                </label>
                <input
                  type="url"
                  id="originalUrl"
                  name="originalUrl"
                  required
                  value={formData.originalUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.youtube.com/watch?v=... or https://tiktok.com/@user/video/123... or direct video URL"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Supported: YouTube, Vimeo, TikTok, Instagram, Twitter/X, Dailymotion, Twitch, RedGifs, Pornhub, and direct video files (.mp4, .mov, etc.)
                </p>
                {isDetectingMetadata && (
                  <div className="mt-2 flex items-center text-sm text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Detecting RedGifs metadata...
                  </div>
                )}
                {autoDetectedData.title && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      ✓ Metadata detected: <strong>{autoDetectedData.title}</strong>
                      {autoDetectedData.tags.length > 0 && (
                        <span className="ml-2 text-xs">
                          ({autoDetectedData.tags.length} tags found)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-sm text-gray-500">(optional - will be auto-extracted)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your video or leave empty for auto-extraction..."
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags <span className="text-sm text-gray-500">(optional - will be auto-extracted)</span>
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="music, entertainment, tutorial (separate with commas)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Additional tags will be automatically extracted from the video. You can add custom tags here.
                </p>
              </div>

              {/* Preview */}
              {formData.originalUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                    <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                      <iframe
                        src={convertToEmbedUrl(formData.originalUrl)}
                        className="w-full h-full rounded-md"
                        style={{border: 0}}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = '<p class="text-gray-500">Preview not available</p>'
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Extracting Tags...' : 'Next: Rate Tags'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}