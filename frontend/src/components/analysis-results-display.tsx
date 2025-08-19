'use client'

import React, { useState } from 'react'
import { Mic, Eye, FileText, Video, ArrowLeft } from 'lucide-react'
import { TranscriptionDisplay } from './transcription-display'
import { DetectionDisplay } from './detection-display'
import { SummarizationDisplay } from './summarization-display'

interface VideoAnalysisResult {
  video: {
    id: string
    filename: string
    originalUrl: string
    duration?: number
  }
  transcription: Record<string, unknown>
  detection: Record<string, unknown>
  summarization: Record<string, unknown>
  jobs: Array<Record<string, unknown>>
}

interface AnalysisResultsDisplayProps {
  result: VideoAnalysisResult | null
  loading?: boolean
  onBack?: () => void
}

type TabType = 'overview' | 'transcription' | 'detection' | 'summarization'

export function AnalysisResultsDisplay({ result, loading = false, onBack }: AnalysisResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No analysis results available</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Video },
    { 
      id: 'transcription', 
      label: 'Transcription', 
      icon: Mic,
      available: !!result.transcription
    },
    { 
      id: 'detection', 
      label: 'Detection', 
      icon: Eye,
      available: !!result.detection
    },
    { 
      id: 'summarization', 
      label: 'Summary', 
      icon: FileText,
      available: !!result.summarization
    },
  ]

  const availableTabs = tabs.filter(tab => tab.id === 'overview' || tab.available)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-700 bg-green-100'
      case 'RUNNING': return 'text-blue-700 bg-blue-100'
      case 'PENDING': return 'text-yellow-700 bg-yellow-100'
      case 'FAILED': return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{result.video.filename}</h2>
          <p className="text-gray-600">Video Analysis Results</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Video Info */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Video Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Filename</label>
                  <p className="text-gray-900">{result.video.filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Video ID</label>
                  <p className="text-gray-900 font-mono text-sm">{result.video.id}</p>
                </div>
              </div>
            </div>

            {/* Jobs Status */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Analysis Jobs Status</h3>
              <div className="space-y-3">
                {result.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {job.type === 'transcription' && <Mic className="w-4 h-4" />}
                        {job.type === 'detection' && <Eye className="w-4 h-4" />}
                        {job.type === 'summarization' && <FileText className="w-4 h-4" />}
                        <span className="font-medium capitalize">{job.type}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {job.completedAt ? new Date(job.completedAt).toLocaleString() : 
                       job.startedAt ? 'In progress...' : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.transcription && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium">Transcription</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {result.transcription.segments?.length || 0} segments
                  </p>
                  <button
                    onClick={() => setActiveTab('transcription')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details →
                  </button>
                </div>
              )}

              {result.detection && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium">Detection</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {result.detection.objects?.length || 0} objects detected
                  </p>
                  <button
                    onClick={() => setActiveTab('detection')}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    View Details →
                  </button>
                </div>
              )}

              {result.summarization && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium">Summary</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {result.summarization.sentiment} sentiment
                  </p>
                  <button
                    onClick={() => setActiveTab('summarization')}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    View Details →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transcription' && (
          <TranscriptionDisplay result={result.transcription} />
        )}

        {activeTab === 'detection' && (
          <DetectionDisplay result={result.detection} />
        )}

        {activeTab === 'summarization' && (
          <SummarizationDisplay result={result.summarization} />
        )}
      </div>
    </div>
  )
}