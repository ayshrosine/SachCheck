'use client'

import { useState } from 'react'

export default function PrivacyPolicy() {
  const [hasConsented, setHasConsented] = useState(false)

  const handleConsent = () => {
    localStorage.setItem('sachcheck_consent', 'true')
    setHasConsented(true)
  }

  const checkConsent = () => {
    const consent = localStorage.getItem('sachcheck_consent')
    setHasConsented(consent === 'true')
  }

  useState(() => {
    checkConsent()
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy Policy
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                What We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                SachCheck processes the following types of data when you use our service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Media files you upload for analysis (videos, audio, images)</li>
                <li>Device identifier for scan history tracking</li>
                <li>Analysis results (verdicts, confidence scores, reasons)</li>
                <li>Optional feedback on analysis accuracy</li>
                <li>Optional email address if you choose to create an account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                How We Use Your Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your data is used exclusively for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Analyzing media for potential manipulation or scams</li>
                <li>Providing you with analysis results</li>
                <li>Maintaining your scan history (tied to your device)</li>
                <li>Improving our analysis accuracy through your feedback</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Retention
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Important: Your uploaded media files are automatically deleted after 48 hours.
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Original media files: 48 hours maximum</li>
                <li>Analysis results (verdicts, reasons): Until you delete your account</li>
                <li>Device identifier: Until you clear your browser/app storage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement multiple security measures:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Encryption in transit (HTTPS/TLS)</li>
                <li>Encryption at rest (Cloudflare R2, Supabase)</li>
                <li>Row-level security in our database</li>
                <li>Access controls limiting data to authorized personnel only</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Under India's DPDP Act and general data protection principles, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Access your personal data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent at any time</li>
                <li>File a complaint about our data practices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                What We Don't Do
              </h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>We never sell your data to third parties</li>
                <li>We never use your uploaded media to train AI models without explicit consent</li>
                <li>We never share your data with advertisers</li>
                <li>We never retain your media files beyond the 48-hour analysis window</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Contact & Grievances
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For privacy concerns, data requests, or grievances:
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200">
                  Email: privacy@sachcheck.com
                </p>
                <p className="text-blue-800 dark:text-blue-200 mt-2">
                  We respond to all privacy inquiries within 7 business days.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Legal Compliance
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                This privacy policy is designed to comply with India's Digital Personal Data Protection Act (DPDP) 2023 and applicable international data protection regulations. Last updated: July 15, 2026.
              </p>
            </section>
          </div>

          {!hasConsented && (
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                By using SachCheck, you consent to this privacy policy and our data practices.
              </p>
              <button
                onClick={handleConsent}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                I Understand and Accept
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}