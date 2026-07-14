'use client'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Terms of Service
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing or using SachCheck, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Service Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                SachCheck provides AI-powered analysis of media files (videos, audio, images) to detect potential manipulation, deepfakes, or scam content. Our service is designed for informational purposes only.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Important: SachCheck is an AI assistant, not a definitive authority. Our analysis should inform your decisions, not replace human judgment.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                User Responsibilities
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By using SachCheck, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Only upload media you have the right to analyze</li>
                <li>Not use the service for illegal purposes</li>
                <li>Not attempt to circumvent rate limits or security measures</li>
                <li>Not upload malicious files or attempt to exploit the service</li>
                <li>Respect the privacy of others when uploading media</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Disclaimer of Warranties
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                SachCheck is provided "as is" without warranties of any kind, either express or implied. We do not guarantee:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>100% accuracy in deepfake or scam detection</li>
                <li>Uninterrupted or error-free service</li>
                <li>That results will be timely or suitable for your purposes</li>
                <li>That security measures will prevent all unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                SachCheck and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our service, including but not limited to financial loss, data loss, or harm resulting from reliance on our analysis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Privacy and Data Protection
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your use of SachCheck is also governed by our Privacy Policy, which describes how we collect, use, and protect your data. By using our service, you consent to our data practices as described in the Privacy Policy.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We comply with India's Digital Personal Data Protection Act (DPDP) 2023 and applicable data protection regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Intellectual Property
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                SachCheck retains all rights to its technology, algorithms, and service. You retain ownership of media you upload, but grant us a license to process it for analysis purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Service Modifications
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to modify, suspend, or discontinue the service at any time with or without notice. We may also update these terms from time to time; continued use of the service constitutes acceptance of modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Governing Law
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of courts in India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200">
                  For questions about these Terms of Service:
                </p>
                <p className="text-blue-800 dark:text-blue-200 mt-2">
                  Email: legal@sachcheck.com
                </p>
              </div>
            </section>

            <section>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: July 15, 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}