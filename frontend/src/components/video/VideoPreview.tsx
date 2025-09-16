'use client';

/**
 * Video Preview Component with Video.js Integration
 * Real-time video preview with professional controls and timeline sync
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type { Timeline, VideoProject } from '@/lib/video/types';

interface VideoPreviewProps {
  timeline: Timeline;
  videoProject?: VideoProject;
  playbackRate?: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  className?: string;
}

export function VideoPreview({
  timeline,
  videoProject,
  playbackRate = 1,
  onTimeUpdate,
  onDurationChange,
  className = ''
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Initialize Video.js player
  useEffect(() => {
    if (!playerRef.current && videoRef.current && videoProject) {
      const videoElement = document.createElement('video-js');
      
      // Set basic video element attributes
      videoElement.classList.add('vjs-big-play-centered');
      videoElement.setAttribute('controls', 'true');
      videoElement.setAttribute('preload', 'auto');
      videoElement.setAttribute('width', '100%');
      videoElement.setAttribute('height', 'auto');
      
      videoRef.current.appendChild(videoElement);

      // Initialize Video.js player
      const player = videojs(videoElement, {
        controls: true,
        fluid: true,
        responsive: true,
        playbackRates: [0.25, 0.5, 1, 1.25, 1.5, 2],
        sources: [{
          src: videoProject.proxyUrl || videoProject.sourceUrl,
          type: 'video/mp4'
        }]
      });

      // Set up event listeners
      player.on('ready', () => {
        setIsPlayerReady(true);
        const duration = player.duration();
        if (duration && !isNaN(duration)) {
          setDuration(duration);
          onDurationChange?.(duration);
        }
      });

      player.on('timeupdate', () => {
        const time = player.currentTime();
        if (time !== undefined && !isNaN(time)) {
          setCurrentTime(time);
          onTimeUpdate?.(time);
        }
      });

      player.on('play', () => setIsPlaying(true));
      player.on('pause', () => setIsPlaying(false));

      player.on('loadedmetadata', () => {
        const duration = player.duration();
        if (duration && !isNaN(duration)) {
          setDuration(duration);
          onDurationChange?.(duration);
        }
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
        setIsPlayerReady(false);
      }
    };
  }, [videoProject, onTimeUpdate, onDurationChange]);

  // Sync playhead with timeline
  useEffect(() => {
    const player = playerRef.current;
    if (player && isPlayerReady && Math.abs(player.currentTime() - timeline.playhead) > 0.5) {
      player.currentTime(timeline.playhead);
    }
  }, [timeline.playhead, isPlayerReady]);

  // Set playback rate
  useEffect(() => {
    const player = playerRef.current;
    if (player && isPlayerReady) {
      player.playbackRate(playbackRate);
    }
  }, [playbackRate, isPlayerReady]);

  // Playback controls
  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying, isPlayerReady]);

  // Calculate aspect ratio and sizing
  const aspectRatio = videoProject?.width && videoProject?.height 
    ? videoProject.width / videoProject.height 
    : 16 / 9;
    
  const containerStyle = {
    aspectRatio: aspectRatio.toString(),
    maxWidth: '100%',
    maxHeight: '70vh'
  };

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Video.js Player Container */}
      <div ref={videoRef} className="w-full h-full" />

      {/* Video Overlay (when no video is loaded) */}
      {!videoProject && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <p className="text-lg font-medium mb-1">No video loaded</p>
            <p className="text-sm">Upload a video to start editing</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {videoProject && !isPlayerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Loading video player...</p>
          </div>
        </div>
      )}

      {/* Timeline Sync Indicator */}
      {isPlayerReady && (
        <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}
    </div>
  );
}

// Utility functions
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}