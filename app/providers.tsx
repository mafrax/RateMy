'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { NSFWProvider } from '@/contexts/NSFWContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NSFWProvider>
        {children}
      </NSFWProvider>
    </SessionProvider>
  )
}