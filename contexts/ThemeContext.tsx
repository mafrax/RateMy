'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Check for saved theme in localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (systemPrefersDark) {
      setTheme('dark')
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setThemeManual = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  // Always provide context, even when not mounted
  const contextValue = { 
    theme: mounted ? theme : 'light', 
    toggleTheme, 
    setTheme: setThemeManual 
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={!mounted ? 'opacity-0' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    console.error('useTheme called outside of ThemeProvider. Make sure your component is wrapped with ThemeProvider.')
    throw new Error('useTheme must be used within a ThemeProvider. Check that your component is properly wrapped with ThemeProvider in the layout.')
  }
  return context
}