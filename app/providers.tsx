'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { NSFWProvider } from '@/contexts/NSFWContext'
import { RatingCacheProvider } from '@/contexts/RatingCacheContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NSFWProvider>
        <RatingCacheProvider>
          {children}
        </RatingCacheProvider>
      </NSFWProvider>
    </SessionProvider>
  )
}