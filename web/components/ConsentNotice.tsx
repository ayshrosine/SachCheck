'use client'

import { useState, useEffect } from 'react'
import { X, Shield } from 'lucide-react'

export default function ConsentNotice() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasConsented, setHasConsented] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('sachcheck_consent')
    if (consent !== 'true') {
      setIsVisible(true)
    } else {
      setHasConsented(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('sachcheck_consent', 'true')
    localStorage.setItem('sachcheck_consent_date', new Date().toISOString())
    setIsVisible(false)
    setHasConsented(true)
  }

  const handleDecline = () => {
    // User can still use the basic service but we'll show this again
    localStorage.setItem('sachcheck_consent', 'false')
    setIsVisible(false)
  }

  if (!isVisible || hasConsented) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Privacy & Consent Notice
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              SachCheck analyzes media files to detect deepfakes and scams. Your uploaded files are automatically deleted after 48 hours. We only store analysis results, not your original media. By continuing, you agree to our Privacy Policy and Terms of Service.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                I Accept
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors text-sm"
              >
                Decline
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}