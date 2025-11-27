'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface TranscriptSegment {
  start: number
  end: number
  text: string
  confidence: number
}

interface VideoTranscriptSyncProps {
  videoUrl: string
  transcript: {
    text: string
    duration: number
    language: string
    segments: TranscriptSegment[]
    confidence: number
  }
  onSegmentEdit?: (segmentIndex: number, newText: string) => void
}

export function VideoTranscriptSync({ videoUrl, transcript, onSegmentEdit }: VideoTranscriptSyncProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const transcriptContainerRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null)
  
  // Check if URL is a YouTube video
  const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
  
  // Helper function to convert YouTube URL to embed format
  const convertToYouTubeEmbed = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?enablejsapi=1`
    }
    return url
  }
  
  const youtubeEmbedUrl = isYouTubeUrl ? convertToYouTubeEmbed(videoUrl) : null

  // Update current time and active segment
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)

      // Find active segment
      const segmentIndex = transcript.segments.findIndex(
        seg => time >= seg.start && time < seg.end
      )
      setActiveSegmentIndex(segmentIndex >= 0 ? segmentIndex : null)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [transcript.segments])

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentIndex === null) return
    
    const container = transcriptContainerRef.current
    if (!container) return

    const activeElement = container.querySelector(`[data-segment-index="${activeSegmentIndex}"]`)
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeSegmentIndex])

  const handleSegmentClick = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  function convertToYouTubeEmbed(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Video Player */}
      <div className="lg:w-1/2 flex flex-col">
        <div className="bg-black rounded-lg overflow-hidden aspect-video">
          {isYouTubeUrl && youtubeEmbedUrl ? (
            <iframe
              src={youtubeEmbedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              preload="metadata"
              controls
            />
          )}
        </div>
        
        {/* Custom Controls */}
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={transcript.duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value)
                }
              }}
              className="w-full"
            />
          </div>
          
          <span className="text-sm text-gray-600 font-mono">
            {formatTime(currentTime)} / {formatTime(transcript.duration || 0)}
          </span>
        </div>
      </div>

      {/* Transcript Panel */}
      <div className="lg:w-1/2 flex flex-col">
        <div className="bg-white border rounded-lg shadow-sm flex flex-col h-full">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Transcript</h3>
            <p className="text-sm text-gray-500">
              Language: {transcript.language} • Confidence: {Math.round(transcript.confidence * 100)}%
            </p>
          </div>
          
          <div
            ref={transcriptContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-2"
          >
            {transcript.segments.map((segment, index) => (
              <div
                key={index}
                data-segment-index={index}
                onClick={() => handleSegmentClick(segment.start)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  activeSegmentIndex === index
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-500 mt-1 min-w-[60px]">
                    {formatTime(segment.start)}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed">
                    {segment.text}
                  </p>
                </div>
                
                {segment.confidence < 0.8 && (
                  <div className="mt-1 text-xs text-amber-600">
                    Low confidence ({Math.round(segment.confidence * 100)}%)
                  </div>
                )}
              </div>
            ))}
            
            {transcript.segments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No transcript segments available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
