import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { AssistantProvider } from '@/components/assistant'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SachCheck - Deepfake Detection',
  description: 'AI-powered deepfake and scam detection for videos, audio, and images',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AssistantProvider>{children}</AssistantProvider>
      </body>
    </html>
  )
}
