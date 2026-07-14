'use client'

import { useState, useRef } from 'react'
import { Upload, FileVideo, FileAudio, ImageIcon, Loader2 } from 'lucide-react'

interface UploadCardProps {
  deviceId: string
  onScanComplete: (verdict: any) => void
}

export default function UploadCard({ deviceId, onScanComplete }: UploadCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.')
      return
    }

    // Validate file type
    const validTypes = ['video/', 'audio/', 'image/']
    if (!validTypes.some(type => file.type.startsWith(type))) {
      setError('Invalid file type. Please upload a video, audio, or image file.')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('device_id', deviceId)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch(`${apiUrl}/api/scan`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const verdict = await response.json()
      onScanComplete(verdict)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Create a synthetic event to reuse the file handler
      const syntheticEvent = {
        target: { files: [file] }
      } as any
      handleFileSelect(syntheticEvent)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Upload Media for Analysis
      </h2>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isUploading
            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="video/*,audio/*,image/*"
          className="hidden"
          disabled={isUploading}
          id="file-upload"
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
            <div className="text-gray-600 dark:text-gray-300">
              <p className="font-medium">Analyzing media...</p>
              <p className="text-sm mt-1">This may take a few moments</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <FileVideo className="w-8 h-8 text-gray-400" />
              <FileAudio className="w-8 h-8 text-gray-400" />
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Drag and drop a file here, or
              </p>
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Browse Files
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supports: MP4, WebM, WAV, MP3, JPG, PNG (Max 50MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Privacy Note:</strong> Your media is automatically deleted after 48 hours.
          We only store the analysis results, not your original files.
        </p>
      </div>
    </div>
  )
}