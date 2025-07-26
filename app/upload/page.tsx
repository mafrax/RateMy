'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function UploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    originalUrl: '',
    description: '',
    tags: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const embedUrl = convertToEmbedUrl(formData.originalUrl)
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          originalUrl: formData.originalUrl,
          embedUrl,
          description: formData.description,
          tags: tagsArray
        }),
      })

      if (response.ok) {
        toast.success('Video uploaded successfully!')
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Upload Video
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  Supported: YouTube, Vimeo, TikTok, Instagram, Twitter/X, Dailymotion, Twitch, and direct video files (.mp4, .mov, etc.)
                </p>
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
                        frameBorder="0"
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
                  {isSubmitting ? 'Uploading...' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}