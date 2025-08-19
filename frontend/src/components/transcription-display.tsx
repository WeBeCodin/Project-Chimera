'use client'

import React from 'react'
import { Clock, Mic, Volume2, FileText } from 'lucide-react'

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface TranscriptionResult {
  transcript: string
  confidence: number
  duration: number
  segments: TranscriptSegment[]
}

interface TranscriptionDisplayProps {
  result: TranscriptionResult
  loading?: boolean
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function TranscriptionDisplay({ result, loading = false }: TranscriptionDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No transcription available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            Duration: {formatTime(result.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            Confidence: {(result.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {result.segments?.length || 0} segments
          </span>
        </div>
      </div>

      {/* Full Transcript */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Full Transcript
        </h4>
        <div className="p-4 bg-white border rounded-lg">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {result.transcript}
          </p>
        </div>
      </div>

      {/* Segmented Transcript */}
      {result.segments && result.segments.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline Segments
          </h4>
          <div className="space-y-3">
            {result.segments.map((segment, index) => (
              <div key={index} className="flex gap-4 p-3 bg-white border rounded-lg">
                <div className="flex-shrink-0">
                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {segment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}