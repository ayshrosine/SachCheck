'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import UploadCard from '@/components/UploadCard'
import VerdictCard from '@/components/VerdictCard'
import RecentScans from '@/components/RecentScans'
import ConsentNotice from '@/components/ConsentNotice'
import { AssistantOverlay } from '@/components/assistant'
import { registerNavigationActionHandler } from '@/lib/assistant/actions/navigation'

export default function Home() {
  const router = useRouter()
  const [deviceId] = useState(() => {
    // Generate or retrieve device ID
    if (typeof window !== 'undefined') {
      let storedId = localStorage.getItem('sachcheck_device_id')
      if (!storedId) {
        storedId = crypto.randomUUID()
        localStorage.setItem('sachcheck_device_id', storedId)
      }
      return storedId
    }
    return 'unknown'
  })

  const [currentVerdict, setCurrentVerdict] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  useEffect(
    () => registerNavigationActionHandler((route) => router.push(route)),
    [router],
  )

  const handleScanComplete = (verdict: any) => {
    setCurrentVerdict(verdict)
    setRefreshKey(prev => prev + 1) // Refresh recent scans
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            SachCheck
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            AI-powered deepfake and scam detection
          </p>
          <button
            type="button"
            onClick={() => setIsAssistantOpen(true)}
            className="mt-6 inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            aria-haspopup="dialog"
            aria-expanded={isAssistantOpen}
          >
            ✨ Jarvis
          </button>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            <UploadCard 
              deviceId={deviceId}
              onScanComplete={handleScanComplete}
            />
            
            {currentVerdict && (
              <VerdictCard verdict={currentVerdict} />
            )}
          </div>

          {/* Right Column - Recent Scans */}
          <div>
            <RecentScans 
              deviceId={deviceId}
              refreshKey={refreshKey}
              onSelectScan={setCurrentVerdict}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>Built with Gemma 4 AI • Your media is automatically deleted after 48 hours</p>
          <p className="mt-2">
            <a href="/privacy" className="underline hover:text-blue-600">Privacy Policy</a>
            {' • '}
            <a href="/terms" className="underline hover:text-blue-600">Terms of Service</a>
          </p>
        </footer>
      </div>
      
      <ConsentNotice />
      <AssistantOverlay
        open={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </main>
  )
}
