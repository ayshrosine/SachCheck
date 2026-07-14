'use client'

import { useState, useEffect } from 'react'
import { History, Clock, FileVideo, FileAudio, ImageIcon, Trash2 } from 'lucide-react'

interface RecentScansProps {
  deviceId: string
  refreshKey: number
  onSelectScan: (scan: any) => void
}

interface Scan {
  id: string
  modality: string
  verdict: string
  confidence: number
  created_at: string
}

export default function RecentScans({ deviceId, refreshKey, onSelectScan }: RecentScansProps) {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScans()
  }, [deviceId, refreshKey])

  const fetchScans = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/scans?device_id=${deviceId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch scans')
      }

      const data = await response.json()
      setScans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scans')
    } finally {
      setLoading(false)
    }
  }

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'video':
        return FileVideo
      case 'audio':
        return FileAudio
      case 'image':
        return ImageIcon
      default:
        return FileVideo
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'likely_real':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      case 'likely_fake':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      case 'inconclusive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <History className="w-5 h-5 mr-2" />
          Recent Scans
        </h2>
        <button
          onClick={fetchScans}
          className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading scans...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchScans}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Try again
          </button>
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No scans yet</p>
          <p className="text-sm mt-1">Upload media to see your analysis history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => {
            const ModalityIcon = getModalityIcon(scan.modality)
            return (
              <div
                key={scan.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => onSelectScan(scan)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ModalityIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {scan.modality}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getVerdictColor(scan.verdict)}`}>
                          {scan.verdict.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(scan.created_at)}</span>
                        <span>•</span>
                        <span>{scan.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Trash2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {scans.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Showing last {scans.length} scans
          </p>
        </div>
      )}
    </div>
  )
}