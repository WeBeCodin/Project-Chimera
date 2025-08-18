'use client'

import React from 'react'
import { Eye, Smile, MapPin, Clock, Target } from 'lucide-react'

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

interface DetectedObject {
  name: string
  confidence: number
  boundingBox: BoundingBox
  timestamp: number
}

interface DetectedScene {
  name: string
  confidence: number
  startTime: number
  endTime: number
}

interface DetectedFace {
  confidence: number
  emotions: Record<string, number>
  timestamp: number
}

interface DetectionResult {
  objects: DetectedObject[]
  scenes: DetectedScene[]
  faces: DetectedFace[]
}

interface DetectionDisplayProps {
  result: DetectionResult
  loading?: boolean
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-green-700 bg-green-100'
  if (confidence >= 0.7) return 'text-blue-700 bg-blue-100'
  if (confidence >= 0.5) return 'text-yellow-700 bg-yellow-100'
  return 'text-red-700 bg-red-100'
}

export function DetectionDisplay({ result, loading = false }: DetectionDisplayProps) {
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
        <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No detection results available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Objects Detection */}
      {result.objects && result.objects.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Detected Objects ({result.objects.length})
          </h4>
          <div className="space-y-2">
            {result.objects.map((obj, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium capitalize">{obj.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(obj.confidence)}`}>
                    {(obj.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatTime(obj.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scene Detection */}
      {result.scenes && result.scenes.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Detected Scenes ({result.scenes.length})
          </h4>
          <div className="space-y-2">
            {result.scenes.map((scene, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium capitalize">{scene.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(scene.confidence)}`}>
                    {(scene.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Face & Emotion Detection */}
      {result.faces && result.faces.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Smile className="w-4 h-4" />
            Face & Emotion Analysis ({result.faces.length})
          </h4>
          <div className="space-y-2">
            {result.faces.map((face, index) => (
              <div key={index} className="p-3 bg-white border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(face.confidence)}`}>
                    Face Confidence: {(face.confidence * 100).toFixed(1)}%
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(face.timestamp)}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(face.emotions).map(([emotion, confidence]) => (
                    <span
                      key={emotion}
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
                    >
                      {emotion}: {(confidence * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {result.objects?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Objects</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {result.scenes?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Scenes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {result.faces?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Faces</div>
        </div>
      </div>
    </div>
  )
}