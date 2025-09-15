'use client';

/**
 * Video Editor Page - Main editing interface
 * Combines timeline, preview, and tools
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Timeline } from '@/components/video/Timeline';
import { VideoPreview } from '@/components/video/VideoPreview';
import { Film, Save, Download, Settings, Layers, FileText, Sparkles } from 'lucide-react';
import type { Timeline as TimelineType, VideoProject, Track, Clip } from '@/lib/video/types';

interface VideoEditorProps {
  params: Promise<{ projectId: string }>;
}

export default function VideoEditor({ params }: VideoEditorProps) {
  const router = useRouter();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [timeline, setTimeline] = useState<TimelineType>({
    id: 'timeline-1',
    projectId: '',
    tracks: [],
    duration: 0,
    playhead: 0,
    zoom: 50,
    markers: []
  });
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Resolve params
  useEffect(() => {
    params.then(resolved => {
      setProjectId(resolved.projectId);
      setTimeline(prev => ({ ...prev, projectId: resolved.projectId }));
    });
  }, [params]);

  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would fetch from the API
      // For now, we'll create a mock project
      const mockProject: VideoProject = {
        id: projectId,
        userId: 'user-123',
        title: 'Sample Video Project',
        description: 'A demo video editing project',
        status: 'ready',
        originalFilename: 'sample-video.mp4',
        originalSizeBytes: 50 * 1024 * 1024, // 50MB
        originalFormat: 'video/mp4',
        sourceUrl: '/demo-video.mp4', // Demo video URL
        durationSeconds: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 8000000,
        codec: 'h264',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create sample timeline with tracks and clips
      const mockTracks: Track[] = [
        {
          id: 'track-video-1',
          type: 'video',
          name: 'Video Track 1',
          locked: false,
          visible: true,
          height: 60,
          clips: [
            {
              id: 'clip-1',
              assetId: projectId,
              trackId: 'track-video-1',
              startTime: 0,
              duration: 30,
              inPoint: 0,
              outPoint: 30,
              scale: 1,
              position: { x: 0, y: 0 },
              rotation: 0,
              opacity: 1,
              effects: [],
              volume: 1,
              audioFadeIn: 0,
              audioFadeOut: 0
            },
            {
              id: 'clip-2', 
              assetId: projectId,
              trackId: 'track-video-1',
              startTime: 35,
              duration: 25,
              inPoint: 30,
              outPoint: 55,
              scale: 1,
              position: { x: 0, y: 0 },
              rotation: 0,
              opacity: 1,
              effects: [],
              volume: 1,
              audioFadeIn: 0,
              audioFadeOut: 0
            }
          ]
        },
        {
          id: 'track-audio-1',
          type: 'audio',
          name: 'Audio Track 1',
          locked: false,
          visible: true,
          height: 60,
          clips: [
            {
              id: 'clip-audio-1',
              assetId: projectId + '-audio',
              trackId: 'track-audio-1',
              startTime: 0,
              duration: 60,
              inPoint: 0,
              outPoint: 60,
              scale: 1,
              position: { x: 0, y: 0 },
              rotation: 0,
              opacity: 1,
              effects: [],
              volume: 0.8,
              audioFadeIn: 1,
              audioFadeOut: 2
            }
          ]
        }
      ];

      const mockTimeline: TimelineType = {
        id: 'timeline-1',
        projectId: projectId,
        tracks: mockTracks,
        duration: 60,
        playhead: 0,
        zoom: 50,
        markers: [
          {
            id: 'marker-1',
            time: 10,
            label: 'Intro End',
            color: '#3b82f6',
            type: 'standard'
          },
          {
            id: 'marker-2',
            time: 45,
            label: 'Outro Start',
            color: '#ef4444',
            type: 'standard'
          }
        ]
      };

      setProject(mockProject);
      setTimeline(mockTimeline);
      
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimelineUpdate = useCallback((updatedTimeline: TimelineType) => {
    setTimeline(updatedTimeline);
    // In a real implementation, this would auto-save to the backend
  }, []);

  const handleSelectionChange = useCallback((clipIds: string[]) => {
    setSelectedClips(clipIds);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    // Update timeline playhead if needed
    if (Math.abs(timeline.playhead - time) > 0.1) {
      setTimeline(prev => ({ ...prev, playhead: time }));
    }
  }, [timeline.playhead]);

  const saveProject = async () => {
    try {
      // In a real implementation, this would save to the backend
      console.log('Saving project...', timeline);
      
      // Show success feedback
      alert('Project saved successfully!');
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    }
  };

  const exportVideo = async () => {
    try {
      // In a real implementation, this would trigger video export
      console.log('Exporting video...', timeline);
      
      // Show export dialog or progress
      alert('Video export started! You will be notified when it\'s complete.');
    } catch (error) {
      console.error('Failed to export video:', error);
      alert('Failed to start video export');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Video Editor</h2>
          <p className="text-gray-400">Preparing your project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/editor')}
            className="flex items-center space-x-2 text-white hover:text-gray-300"
          >
            <Film className="w-5 h-5" />
            <span className="font-semibold">Project Chimera</span>
          </button>
          
          <div className="h-4 w-px bg-gray-600" />
          
          <div className="text-white">
            <h1 className="font-medium">{project?.title}</h1>
            <p className="text-xs text-gray-400">{projectId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={saveProject}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={exportVideo}
            className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button className="p-2 text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Asset Browser & Tools */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4">
            <h3 className="text-white font-medium mb-3">Project Assets</h3>
            
            {/* Asset List */}
            <div className="space-y-2">
              {project && (
                <div className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600">
                  <div className="flex items-center space-x-2">
                    <Film className="w-4 h-4 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{project.originalFilename}</p>
                      <p className="text-gray-400 text-xs">
                        {Math.floor(project.durationSeconds / 60)}:
                        {Math.floor(project.durationSeconds % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tools Panel */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-white font-medium mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-center">
                <Layers className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Layers</span>
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-center">
                <FileText className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Text</span>
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-center">
                <Sparkles className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Effects</span>
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-center">
                <Settings className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center - Preview & Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 p-4 bg-gray-900">
            <VideoPreview
              timeline={timeline}
              videoProject={project || undefined}
              onTimeUpdate={handleTimeUpdate}
              className="mx-auto"
            />
          </div>

          {/* Timeline Area */}
          <div className="h-96 border-t border-gray-700">
            <Timeline
              timeline={timeline}
              onUpdate={handleTimelineUpdate}
              selectedClips={selectedClips}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties & AI Assistant */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4">
            <h3 className="text-white font-medium mb-3">Properties</h3>
            
            {selectedClips.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="1"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Scale</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    defaultValue="1"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue="1"
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Select a clip to see properties</p>
            )}
          </div>

          {/* AI Assistant */}
          <div className="p-4 border-t border-gray-700 flex-1">
            <h3 className="text-white font-medium mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
              AI Assistant
            </h3>
            
            <div className="bg-gray-700 rounded-lg p-3 mb-3">
              <p className="text-gray-300 text-sm">
                I can help you with editing suggestions, automatic cuts, 
                color correction, and more. Try asking me to:
              </p>
              <ul className="text-gray-400 text-xs mt-2 space-y-1">
                <li>• Remove silent parts</li>
                <li>• Add transitions</li>
                <li>• Adjust audio levels</li>
                <li>• Suggest cuts</li>
              </ul>
            </div>
            
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Ask AI for help..."
                className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <span>Project: {project?.title}</span>
            <span>Duration: {Math.floor((timeline.duration || 0) / 60)}:{Math.floor((timeline.duration || 0) % 60).toString().padStart(2, '0')}</span>
            <span>Tracks: {timeline.tracks.length}</span>
          </div>
          <div className="flex space-x-2">
            <span>Last saved: Just now</span>
            <span className="text-green-400">●</span>
          </div>
        </div>
      </div>
    </div>
  );
}