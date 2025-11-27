'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Youtube } from 'lucide-react'

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

// Declare global YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string
          playerVars?: Record<string, unknown>
          events?: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number; target: YTPlayer }) => void
          }
        }
      ) => YTPlayer
      PlayerState: {
        PLAYING: number
        PAUSED: number
        ENDED: number
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  destroy: () => void
}

// Helper to get YouTube video ID
function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match ? match[1] : null
}

// Helper to check if URL is YouTube
function isYouTubeUrlCheck(url: string): boolean {
  return url?.includes('youtube.com') || url?.includes('youtu.be')
}

export function VideoTranscriptSync({ videoUrl, transcript, onSegmentEdit }: VideoTranscriptSyncProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const youtubePlayerRef = useRef<YTPlayer | null>(null)
  const transcriptContainerRef = useRef<HTMLDivElement>(null)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null)
  const [youtubeReady, setYoutubeReady] = useState(false)
  const [duration, setDuration] = useState(transcript.duration || 0)
  
  const isYouTube = isYouTubeUrlCheck(videoUrl)
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null

  // Update active segment based on time
  const updateActiveSegment = useCallback((time: number) => {
    const segmentIndex = transcript.segments.findIndex(
      seg => time >= seg.start && time < seg.end
    )
    setActiveSegmentIndex(segmentIndex >= 0 ? segmentIndex : null)
  }, [transcript.segments])

  // Initialize YouTube player
  const initYouTubePlayer = useCallback(() => {
    if (!youtubeVideoId || !window.YT) return

    // Destroy existing player if any
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy()
    }

    youtubePlayerRef.current = new window.YT.Player('youtube-player', {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: (event) => {
          setYoutubeReady(true)
          setDuration(event.target.getDuration())
          
          // Start time update interval
          timeUpdateIntervalRef.current = setInterval(() => {
            if (youtubePlayerRef.current) {
              const time = youtubePlayerRef.current.getCurrentTime()
              setCurrentTime(time)
              updateActiveSegment(time)
            }
          }, 100)
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true)
          } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false)
          }
        }
      }
    })
  }, [youtubeVideoId, updateActiveSegment])

  // Load YouTube IFrame API
  useEffect(() => {
    if (!isYouTube || !youtubeVideoId) return

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initYouTubePlayer()
      return
    }

    // Load the API script
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Set callback for when API is ready
    window.onYouTubeIframeAPIReady = () => {
      initYouTubePlayer()
    }

    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy()
      }
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
      }
    }
  }, [isYouTube, youtubeVideoId, initYouTubePlayer])

  // Handle HTML5 video time updates
  useEffect(() => {
    if (isYouTube) return

    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)
      updateActiveSegment(time)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadedMetadata = () => setDuration(video.duration)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [isYouTube, updateActiveSegment])

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
    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      youtubePlayerRef.current.seekTo(startTime, true)
      youtubePlayerRef.current.playVideo()
    } else if (videoRef.current) {
      videoRef.current.currentTime = startTime
      videoRef.current.play()
    }
  }

  const togglePlayPause = () => {
    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo()
      } else {
        youtubePlayerRef.current.playVideo()
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      if (isMuted) {
        youtubePlayerRef.current.unMute()
      } else {
        youtubePlayerRef.current.mute()
      }
      setIsMuted(!isMuted)
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const seekTo = (time: number) => {
    if (isYouTube && youtubePlayerRef.current && youtubeReady) {
      youtubePlayerRef.current.seekTo(time, true)
    } else if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  const skipBackward = () => {
    seekTo(Math.max(0, currentTime - 10))
  }

  const skipForward = () => {
    seekTo(Math.min(duration, currentTime + 10))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {isYouTube && <Youtube className="w-6 h-6 text-red-600" />}
        <h2 className="text-xl font-bold text-gray-900">Video & Transcript Sync</h2>
        {isYouTube && !youtubeReady && (
          <span className="text-sm text-gray-500">(Loading player...)</span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
        {/* Video Player */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            {isYouTube ? (
              <div id="youtube-player" className="w-full h-full" />
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full"
                preload="metadata"
              />
            )}
          </div>
          
          {/* Custom Controls */}
          <div className="mt-4 p-4 bg-gray-100 rounded-lg space-y-3">
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-mono w-16">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-sm text-gray-600 font-mono w-16 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={skipBackward}
                className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                title="Skip back 10s"
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                disabled={isYouTube && !youtubeReady}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button
                onClick={skipForward}
                className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                title="Skip forward 10s"
              >
                <SkipForward size={20} />
              </button>

              <div className="ml-4 border-l pl-4">
                <button
                  onClick={toggleMute}
                  className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Panel */}
        <div className="lg:w-1/2 flex flex-col min-h-[400px]">
          <div className="bg-white border rounded-lg shadow-sm flex flex-col flex-1">
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
              <div className="flex gap-4 mt-1 text-sm text-gray-500">
                <span>Language: <strong>{transcript.language.toUpperCase()}</strong></span>
                <span>Confidence: <strong>{Math.round(transcript.confidence * 100)}%</strong></span>
                <span>Segments: <strong>{transcript.segments.length}</strong></span>
              </div>
            </div>
            
            <div
              ref={transcriptContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]"
            >
              {transcript.segments.map((segment, index) => (
                <div
                  key={index}
                  data-segment-index={index}
                  onClick={() => handleSegmentClick(segment.start)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    activeSegmentIndex === index
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono mt-1 min-w-[60px] ${
                      activeSegmentIndex === index ? 'text-blue-600 font-bold' : 'text-gray-500'
                    }`}>
                      {formatTime(segment.start)}
                    </span>
                    <p className={`flex-1 text-sm leading-relaxed ${
                      activeSegmentIndex === index ? 'text-gray-900 font-medium' : 'text-gray-700'
                    }`}>
                      {segment.text}
                    </p>
                  </div>
                  
                  {segment.confidence < 0.8 && (
                    <div className="mt-1 text-xs text-amber-600 ml-[72px]">
                      ⚠ Low confidence ({Math.round(segment.confidence * 100)}%)
                    </div>
                  )}
                </div>
              ))}
              
              {transcript.segments.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="font-medium">No transcript segments available</p>
                  <p className="text-sm mt-1">The video may not have been transcribed yet</p>
                </div>
              )}
            </div>

            {/* Full transcript text */}
            {transcript.text && transcript.segments.length > 0 && (
              <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                    View full transcript
                  </summary>
                  <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {transcript.text}
                  </p>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
