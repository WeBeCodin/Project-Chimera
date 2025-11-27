'use client'

import React from 'react'
import { Play, Calendar, Clock, FileText, CheckCircle } from 'lucide-react'

interface Video {
  id: string
  title: string
  description?: string
  status: string
  sourceUrl: string
  originalFilename?: string
  durationSeconds?: number
  width?: number
  height?: number
  createdAt: string
  hasCompletedJob?: boolean
}

interface VideoGalleryProps {
  videos: Video[]
  loading?: boolean
  onVideoClick?: (videoId: string) => void
  onWatchTranscript?: (videoId: string, sourceUrl: string) => void
  completedJobVideoIds?: string[]
}

// Helper to detect YouTube URLs
function isYouTubeUrl(url: string): boolean {
  return url?.includes('youtube.com') || url?.includes('youtu.be')
}

// Helper to extract YouTube video ID
function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match ? match[1] : null
}

// Helper to get YouTube thumbnail
function getYouTubeThumbnail(url: string): string | null {
  const videoId = getYouTubeVideoId(url)
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
}

export function VideoGallery({ videos, loading, onVideoClick, onWatchTranscript, completedJobVideoIds = [] }: VideoGalleryProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading videos...</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Videos Yet</h3>
        <p className="text-gray-500">Upload your first video to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Your Videos ({videos.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((video) => {
          const isYouTube = isYouTubeUrl(video.sourceUrl)
          const youtubeThumbnail = isYouTube ? getYouTubeThumbnail(video.sourceUrl) : null
          const youtubeVideoId = isYouTube ? getYouTubeVideoId(video.sourceUrl) : null
          const hasAnalysis = completedJobVideoIds.includes(video.id)
          
          return (
            <div
              key={video.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Video Thumbnail / Player */}
              <div className="relative bg-gray-900 aspect-video">
                {isYouTube && youtubeVideoId ? (
                  // YouTube iframe embed
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={video.title || 'YouTube video'}
                  />
                ) : video.sourceUrl ? (
                  <video
                    src={video.sourceUrl}
                    className="w-full h-full object-contain"
                    controls
                    preload="metadata"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                
                {/* Status Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {hasAnalysis && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Analyzed
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    video.status === 'ready' 
                      ? 'bg-green-500 text-white'
                      : video.status === 'processing'
                      ? 'bg-blue-500 text-white'
                      : video.status === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {video.status.toUpperCase()}
                  </span>
                </div>
              </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
                {video.title || video.originalFilename || 'Untitled Video'}
              </h3>
              
              {video.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {video.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
                
                {video.durationSeconds && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, '0')}</span>
                  </div>
                )}
                
                {video.width && video.height && (
                  <span className="text-xs">
                    {video.width}x{video.height}
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onVideoClick?.(video.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Details
                </button>
                {hasAnalysis && (
                  <button
                    onClick={() => onWatchTranscript?.(video.id, video.sourceUrl)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    Watch & Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )
        })}
      </div>
    </div>
  )
}
