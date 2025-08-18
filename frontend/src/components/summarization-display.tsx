'use client'

import React from 'react'
import { FileText, TrendingUp, Hash, Clock, Heart } from 'lucide-react'

interface SummarizationResult {
  summary: string
  keyPoints: string[]
  sentiment: string
  topics: string[]
  duration: number
}

interface SummarizationDisplayProps {
  result: SummarizationResult
  loading?: boolean
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return 'text-green-700 bg-green-100'
    case 'negative':
      return 'text-red-700 bg-red-100'
    case 'neutral':
      return 'text-gray-700 bg-gray-100'
    default:
      return 'text-blue-700 bg-blue-100'
  }
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return '😊'
    case 'negative':
      return '😞'
    case 'neutral':
      return '😐'
    default:
      return '🤔'
  }
}

export function SummarizationDisplay({ result, loading = false }: SummarizationDisplayProps) {
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
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No summary available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {formatTime(result.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {result.topics?.length || 0} topics
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {result.keyPoints?.length || 0} key points
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-gray-500" />
          <span className={`text-sm px-2 py-1 rounded-full ${getSentimentColor(result.sentiment)}`}>
            {getSentimentIcon(result.sentiment)} {result.sentiment}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Summary
        </h4>
        <div className="p-4 bg-white border rounded-lg">
          <p className="text-gray-800 leading-relaxed">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Key Points */}
      {result.keyPoints && result.keyPoints.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Key Points
          </h4>
          <div className="space-y-2">
            {result.keyPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <p className="text-gray-800 text-sm leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics */}
      {result.topics && result.topics.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.topics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium"
              >
                #{topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment Analysis */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Sentiment Analysis
        </h4>
        <div className="p-4 bg-white border rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getSentimentIcon(result.sentiment)}</span>
            <div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(result.sentiment)}`}>
                {result.sentiment?.charAt(0).toUpperCase() + result.sentiment?.slice(1)}
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Overall sentiment detected in the video content
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}