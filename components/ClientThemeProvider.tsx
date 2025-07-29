'use client'

import { ThemeProvider } from '../contexts/ThemeContext'

interface ClientThemeProviderProps {
  children: React.ReactNode
}

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}