'use client'

import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Sparkles } from 'lucide-react'

interface VerdictCardProps {
  verdict: any
}

export default function VerdictCard({ verdict }: VerdictCardProps) {
  const getVerdictConfig = (verdictType: string) => {
    switch (verdictType) {
      case 'likely_real':
        return {
          icon: CheckCircle,
          color: 'green',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          title: 'Likely Real'
        }
      case 'suspicious':
        return {
          icon: AlertTriangle,
          color: 'yellow',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          title: 'Suspicious'
        }
      case 'likely_fake':
        return {
          icon: XCircle,
          color: 'red',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          title: 'Likely Fake'
        }
      case 'inconclusive':
        return {
          icon: HelpCircle,
          color: 'gray',
          bgColor: 'bg-gray-50 dark:bg-gray-700/20',
          borderColor: 'border-gray-200 dark:border-gray-600',
          textColor: 'text-gray-800 dark:text-gray-200',
          title: 'Inconclusive'
        }
      default:
        return {
          icon: HelpCircle,
          color: 'gray',
          bgColor: 'bg-gray-50 dark:bg-gray-700/20',
          borderColor: 'border-gray-200 dark:border-gray-600',
          textColor: 'text-gray-800 dark:text-gray-200',
          title: 'Unknown'
        }
    }
  }

  const config = getVerdictConfig(verdict.verdict)
  const Icon = config.icon

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-yellow-500'
    if (confidence >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const handleFeedback = (wasCorrect: boolean) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id: verdict.id,
          was_verdict_correct: wasCorrect
        })
      })
      .then(response => {
        if (response.ok) {
          alert('Thank you for your feedback!')
        } else {
          throw new Error('Feedback submission failed')
        }
      })
      .catch(error => {
        console.error('Failed to submit feedback:', error)
        alert('Failed to submit feedback. Please try again.')
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    }
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg shadow-lg p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className={`w-8 h-8 ${config.textColor}`} />
          <div>
            <h3 className={`text-xl font-bold ${config.textColor}`}>
              {config.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confidence: {verdict.confidence}%
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {verdict.modality?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getConfidenceColor(verdict.confidence)}`}
            style={{ width: `${verdict.confidence}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      {verdict.reasons && verdict.reasons.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Analysis Reasons
          </h4>
          <ul className="space-y-2">
            {verdict.reasons.map((reason: string, index: number) => (
              <li
                key={index}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
              >
                <span className="mr-2">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modality Flags */}
      {verdict.modality_flags && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Detailed Analysis
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(verdict.modality_flags).map(([key, value]) => (
              <div
                key={key}
                className={`p-2 rounded ${
                  value === true
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    : value === false
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <span className="font-medium">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="ml-2">
                  {value === true ? '⚠️' : value === false ? '✅' : '❓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Analyzed with {verdict.model_used || 'AI Model'} •{' '}
          {new Date(verdict.created_at).toLocaleString()}
        </p>
      </div>

      {/* Feedback Buttons */}
      <div className="mt-4 flex space-x-3">
        <button
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          onClick={() => handleFeedback(true)}
        >
          👍 Correct
        </button>
        <button
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          onClick={() => handleFeedback(false)}
        >
          👎 Incorrect
        </button>
      </div>
    </div>
  )
}