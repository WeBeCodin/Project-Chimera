'use client';

/**
 * Timeline Component - Professional video editing timeline
 * Canvas-based rendering with tracks, clips, and real-time playback
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import type { Timeline, Track, Clip, TimeRange } from '@/lib/video/types';

interface TimelineProps {
  timeline: Timeline;
  onUpdate?: (timeline: Timeline) => void;
  selectedClips?: string[];
  onSelectionChange?: (clipIds: string[]) => void;
}

export function Timeline({ 
  timeline, 
  onUpdate, 
  selectedClips = [], 
  onSelectionChange 
}: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(50); // pixels per second
  const [isDragging, setIsDragging] = useState(false);
  const [playhead, setPlayhead] = useState(timeline.playhead || 0);

  // Canvas dimensions
  const canvasHeight = 400;
  const trackHeight = 60;
  const rulerHeight = 30;

  // Timeline controls
  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(timeline.duration, time)));
    setPlayhead(time);
  }, [timeline.duration]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(200, prev * 1.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(10, prev / 1.5));
  }, []);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => {
    return time * zoom;
  }, [zoom]);

  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number) => {
    return pixel / zoom;
  }, [zoom]);

  // Draw ruler with time markers
  const drawRuler = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, width, rulerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';

    // Draw time markers
    const interval = Math.max(1, Math.floor(60 / zoom)); // Adjust interval based on zoom
    for (let time = 0; time <= timeline.duration; time += interval) {
      const x = timeToPixel(time);
      if (x > width) break;

      // Major tick
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 0, 1, rulerHeight);

      // Time label
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.fillText(timeText, x, rulerHeight - 5);

      // Minor ticks
      for (let i = 1; i < 5; i++) {
        const minorTime = time + (interval * i) / 5;
        if (minorTime > timeline.duration) break;
        const minorX = timeToPixel(minorTime);
        if (minorX <= width) {
          ctx.fillStyle = '#9ca3af';
          ctx.fillRect(minorX, rulerHeight - 8, 1, 8);
        }
      }
    }
  }, [timeToPixel, timeline.duration, zoom]);

  // Draw track background
  const drawTrack = useCallback((ctx: CanvasRenderingContext2D, track: Track, trackIndex: number, width: number) => {
    const y = rulerHeight + (trackIndex * trackHeight);
    
    // Track background
    ctx.fillStyle = trackIndex % 2 === 0 ? '#1f2937' : '#111827';
    ctx.fillRect(0, y, width, trackHeight);

    // Track border
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, y, width, trackHeight);

    // Track label area
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, y, 100, trackHeight);

    // Track name
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(track.name, 8, y + trackHeight / 2 + 4);

    // Track type indicator
    const typeColor = track.type === 'video' ? '#3b82f6' : 
                      track.type === 'audio' ? '#10b981' : '#8b5cf6';
    ctx.fillStyle = typeColor;
    ctx.fillRect(8, y + 5, 4, 4);
  }, [trackHeight, rulerHeight]);

  // Draw clip
  const drawClip = useCallback((ctx: CanvasRenderingContext2D, clip: Clip, track: Track, trackIndex: number) => {
    const x = timeToPixel(clip.startTime);
    const width = timeToPixel(clip.duration);
    const y = rulerHeight + (trackIndex * trackHeight) + 5;
    const height = trackHeight - 10;

    // Skip if clip is outside visible area
    if (x + width < 0 || x > ctx.canvas.width) return;

    // Clip background
    const isSelected = selectedClips.includes(clip.id);
    ctx.fillStyle = isSelected ? '#3b82f6' : '#059669';
    ctx.fillRect(x, y, width, height);

    // Clip border
    ctx.strokeStyle = isSelected ? '#1d4ed8' : '#047857';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Clip label
    if (width > 60) { // Only show label if clip is wide enough
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      
      // Truncate long names
      let clipName = clip.assetId.substring(0, 12);
      if (clip.assetId.length > 12) clipName += '...';
      
      ctx.fillText(clipName, x + 4, y + 15);
      
      // Duration
      const duration = `${clip.duration.toFixed(1)}s`;
      ctx.font = '9px system-ui';
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(duration, x + 4, y + height - 5);
    }

    // Trim handles
    if (isSelected && width > 20) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 3, height); // Left handle
      ctx.fillRect(x + width - 3, y, 3, height); // Right handle
    }
  }, [timeToPixel, trackHeight, rulerHeight, selectedClips]);

  // Draw playhead
  const drawPlayhead = useCallback((ctx: CanvasRenderingContext2D) => {
    const x = timeToPixel(playhead);
    
    // Playhead line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ctx.canvas.height);
    ctx.stroke();

    // Playhead handle
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 6, 0, 12, rulerHeight);

    // Triangle indicator
    ctx.beginPath();
    ctx.moveTo(x - 6, rulerHeight);
    ctx.lineTo(x + 6, rulerHeight);
    ctx.lineTo(x, rulerHeight + 8);
    ctx.closePath();
    ctx.fill();
  }, [playhead, timeToPixel, rulerHeight]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw ruler
    drawRuler(ctx, width);

    // Draw tracks and clips
    timeline.tracks.forEach((track, index) => {
      drawTrack(ctx, track, index, width);
      
      // Draw clips
      track.clips.forEach(clip => {
        drawClip(ctx, clip, track, index);
      });
    });

    // Draw playhead
    drawPlayhead(ctx);

  }, [timeline, drawRuler, drawTrack, drawClip, drawPlayhead]);

  // Handle canvas clicks
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on playhead area (ruler)
    if (y <= rulerHeight) {
      const newTime = pixelToTime(x);
      seekTo(newTime);
      return;
    }

    // Check if clicking on a clip
    const trackIndex = Math.floor((y - rulerHeight) / trackHeight);
    const track = timeline.tracks[trackIndex];
    
    if (track) {
      const clickTime = pixelToTime(x);
      const clickedClip = track.clips.find(clip => 
        clickTime >= clip.startTime && clickTime <= clip.startTime + clip.duration
      );
      
      if (clickedClip) {
        const newSelection = e.metaKey || e.ctrlKey 
          ? selectedClips.includes(clickedClip.id)
            ? selectedClips.filter(id => id !== clickedClip.id)
            : [...selectedClips, clickedClip.id]
          : [clickedClip.id];
        
        onSelectionChange?.(newSelection);
      } else {
        onSelectionChange?.([]);
      }
    }
  }, [pixelToTime, seekTo, selectedClips, onSelectionChange, timeline.tracks, trackHeight, rulerHeight]);

  // Handle canvas resize
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = canvasHeight;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${canvasHeight}px`;
  }, []);

  // Animation loop for playback
  useEffect(() => {
    if (!isPlaying) return;

    const animationFrame = () => {
      setCurrentTime(prev => {
        const newTime = prev + 1/30; // 30 FPS
        if (newTime >= timeline.duration) {
          setIsPlaying(false);
          return timeline.duration;
        }
        setPlayhead(newTime);
        return newTime;
      });
    };

    const interval = setInterval(animationFrame, 1000/30);
    return () => clearInterval(interval);
  }, [isPlaying, timeline.duration]);

  // Resize observer
  useEffect(() => {
    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [updateCanvasSize]);

  // Render timeline
  useEffect(() => {
    render();
  }, [render]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'Home':
          seekTo(0);
          break;
        case 'End':
          seekTo(timeline.duration);
          break;
        case 'ArrowLeft':
          seekTo(playhead - 1);
          break;
        case 'ArrowRight':
          seekTo(playhead + 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayback, seekTo, playhead, timeline.duration]);

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => seekTo(0)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={togglePlayback}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => seekTo(timeline.duration)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm font-mono">
            {Math.floor(playhead / 60)}:{Math.floor(playhead % 60).toString().padStart(2, '0')} / 
            {Math.floor(timeline.duration / 60)}:{Math.floor(timeline.duration % 60).toString().padStart(2, '0')}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-xs text-gray-400 min-w-12 text-center">
              {Math.round(zoom)}px/s
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div ref={containerRef} className="relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="block cursor-crosshair"
          style={{ height: canvasHeight }}
        />
      </div>

      {/* Status Bar */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between items-center">
          <div>
            Tracks: {timeline.tracks.length} | 
            Clips: {timeline.tracks.reduce((sum, track) => sum + track.clips.length, 0)} |
            Selected: {selectedClips.length}
          </div>
          <div>
            {isPlaying ? 'Playing' : 'Paused'}
          </div>
        </div>
      </div>
    </div>
  );
}