'use client'

import { useTheme } from '../contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <SunIcon 
          className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        
        {/* Moon Icon */}
        <MoonIcon 
          className={`absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-0 -rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
      </div>
    </button>
  )
}

export function ThemeToggleWithLabel() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">Theme:</span>
      <button
        onClick={toggleTheme}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <div className="relative w-4 h-4">
          <SunIcon 
            className={`absolute inset-0 w-4 h-4 text-yellow-500 transition-all duration-300 ${
              theme === 'dark' 
                ? 'opacity-0 rotate-90 scale-0' 
                : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <MoonIcon 
            className={`absolute inset-0 w-4 h-4 text-blue-400 transition-all duration-300 ${
              theme === 'light' 
                ? 'opacity-0 -rotate-90 scale-0' 
                : 'opacity-100 rotate-0 scale-100'
            }`}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
          {theme}
        </span>
      </button>
    </div>
  )
}