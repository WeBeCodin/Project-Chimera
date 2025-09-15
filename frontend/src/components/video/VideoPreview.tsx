'use client';

/**
 * Video Preview Component
 * Real-time video preview with compositing and effects
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import type { Timeline, VideoProject } from '@/lib/video/types';

interface VideoPreviewProps {
  timeline: Timeline;
  videoProject?: VideoProject;
  playbackRate?: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export function VideoPreview({
  timeline,
  videoProject,
  playbackRate = 1,
  onTimeUpdate,
  className = ''
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  // Initialize video preview
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && videoProject) {
      // Set video source
      if (videoProject.proxyUrl || videoProject.sourceUrl) {
        video.src = videoProject.proxyUrl || videoProject.sourceUrl;
      }
      
      // Set dimensions
      if (videoProject.width && videoProject.height) {
        setDimensions({ width: videoProject.width, height: videoProject.height });
      }
    }
  }, [videoProject]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      const newTime = video.currentTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    }
  }, [onTimeUpdate]);

  // Sync playhead with timeline
  useEffect(() => {
    const video = videoRef.current;
    if (video && Math.abs(video.currentTime - timeline.playhead) > 0.1) {
      video.currentTime = timeline.playhead;
    }
  }, [timeline.playhead]);

  // Playback controls
  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, [isFullscreen]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Render video frame to canvas (for compositing effects)
  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.videoWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply timeline effects here (future enhancement)
    // This is where we would composite multiple clips, apply effects, etc.
    
  }, []);

  // Animation loop for canvas rendering
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      renderFrame();
      animationId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, renderFrame]);

  // Set playback rate
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Calculate aspect ratio and sizing
  const aspectRatio = dimensions.width / dimensions.height;
  const containerStyle = {
    aspectRatio: aspectRatio.toString(),
    maxWidth: '100%',
    maxHeight: '70vh'
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Video Element (hidden, used for source) */}
      <video
        ref={videoRef}
        className="hidden"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) {
            setDimensions({
              width: video.videoWidth || 1920,
              height: video.videoHeight || 1080
            });
          }
        }}
        preload="metadata"
        playsInline
      />

      {/* Canvas for rendering composited video */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ background: '#000' }}
      />

      {/* Video Overlay (when no video is loaded) */}
      {!videoProject && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <p className="text-lg font-medium mb-1">No video loaded</p>
            <p className="text-sm">Upload a video to start editing</p>
          </div>
        </div>
      )}

      {/* Control Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlayback}
              disabled={!videoProject}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>

            {/* Time Display */}
            <div className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(videoProject?.durationSeconds || 0)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-1 text-white hover:text-gray-300 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 text-white hover:text-gray-300 transition-colors"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="relative">
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ 
                  width: `${videoProject ? (currentTime / videoProject.durationSeconds) * 100 : 0}%` 
                }}
              />
            </div>
            
            {/* Click to seek */}
            <input
              type="range"
              min="0"
              max={videoProject?.durationSeconds || 100}
              value={currentTime}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                const video = videoRef.current;
                if (video) {
                  video.currentTime = newTime;
                  setCurrentTime(newTime);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {videoProject && currentTime === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Video Info Overlay */}
      {videoProject && isFullscreen && (
        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-lg text-sm">
          <div className="font-medium">{videoProject.title}</div>
          <div className="text-gray-300">
            {dimensions.width}×{dimensions.height} • {formatFileSize(videoProject.originalSizeBytes)}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility functions
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}