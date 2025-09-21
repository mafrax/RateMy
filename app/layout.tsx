import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ClientThemeProvider } from '@/components/ClientThemeProvider'
import { Navbar } from '@/components/Navbar'
import { FeedbackButton } from '@/components/FeedbackButton'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RateMe - Video Rating Platform',
  description: 'Rate and discover videos with tags and community ratings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientThemeProvider>
          <Providers>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <Navbar />
              <main className="w-full mx-auto py-8">
                {children}
              </main>
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
            <FeedbackButton />
          </Providers>
        </ClientThemeProvider>
        
        {/* Handle browser extension attributes to prevent hydration warnings */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Handle Grammarly and other browser extension attributes
              if (typeof window !== 'undefined') {
                // Remove extension attributes that cause hydration mismatches
                const removeExtensionAttributes = () => {
                  const body = document.body;
                  if (body) {
                    // Grammarly attributes
                    body.removeAttribute('data-new-gr-c-s-check-loaded');
                    body.removeAttribute('data-gr-ext-installed');
                    // Other common extension attributes
                    body.removeAttribute('data-lastpass-icon-root');
                    body.removeAttribute('data-1p-extension');
                    body.removeAttribute('cz-shortcut-listen');
                  }
                };
                
                // Run after DOM is loaded
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeExtensionAttributes);
                } else {
                  removeExtensionAttributes();
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}