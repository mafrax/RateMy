'use client'

import Link from 'next/link'
import { PlayIcon, StarIcon, UserGroupIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

export function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Check if the user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')
    
    if (!hasSeenWelcome) {
      setIsModalOpen(true)
    }
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Set flag in localStorage so modal doesn't appear again
    localStorage.setItem('hasSeenWelcomeModal', 'true')
  }

  const handleGetStarted = () => {
    handleCloseModal()
    // Navigate to upload page - the Link component will handle this
  }

  if (!isModalOpen) {
    return null
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal Content */}
        <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20">
          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            aria-label="Close welcome modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Background patterns */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-16 left-8 animate-bounce">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-purple-400/30">
              <StarIcon className="w-6 h-6 text-purple-300" />
            </div>
          </div>
          <div className="absolute top-20 right-16 animate-pulse delay-1000">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-400/30">
              <PlayIcon className="w-5 h-5 text-blue-300" />
            </div>
          </div>
          <div className="absolute bottom-16 left-12 animate-bounce delay-500">
            <div className="w-11 h-11 bg-pink-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-pink-400/30">
              <UserGroupIcon className="w-5 h-5 text-pink-300" />
            </div>
          </div>
          
          <div className="relative p-8 sm:p-12">
            <div className="text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center rounded-full bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 ring-1 ring-purple-500/20 backdrop-blur-sm">
                <SparklesIcon className="mr-2 h-4 w-4" />
                Welcome to RateMe
              </div>
              
              {/* Main heading */}
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Rate
                </span>
                <span className="text-white"> & </span>
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Discover
                </span>
                <br />
                <span className="text-white text-3xl sm:text-4xl lg:text-5xl">Amazing Videos</span>
              </h1>
              
              {/* Subtitle */}
              <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
                Share your favorite videos, rate them with custom tags, and discover incredible content through 
                <span className="text-purple-300 font-semibold"> community-driven ratings</span>. 
                Join our community of creators and viewers!
              </p>
              
              {/* Feature highlights */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-medium">Custom Tag Ratings</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                  <PlayIcon className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium">Seamless Playback</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                  <UserGroupIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium">Community Driven</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Link
                  href="/upload"
                  onClick={handleGetStarted}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg hover:shadow-purple-500/25 hover:shadow-2xl transform hover:scale-105 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                >
                  <PlayIcon className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Get Started
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                </Link>
                
                <Link
                  href="/videos"
                  onClick={handleGetStarted}
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-purple-400/50 rounded-xl hover:border-purple-400 hover:bg-purple-500/10 backdrop-blur-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
                >
                  Browse Videos
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">→</span>
                </Link>
              </div>
              
              {/* Skip option */}
              <div className="mt-8">
                <button
                  onClick={handleCloseModal}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors underline"
                >
                  Skip and continue to main page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}