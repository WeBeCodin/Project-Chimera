'use client';

/**
 * Video Upload Component
 * Handles drag-and-drop video upload with progress tracking
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, Film, X, CheckCircle } from 'lucide-react';
import { videoProcessor } from '@/lib/video/processor';
import type { UploadInitiateRequest, UploadInitiateResponse, VideoMetadata } from '@/lib/video/types';

interface VideoUploadProps {
  workspaceId: string;
  onUploadComplete?: (projectId: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadState {
  status: 'idle' | 'processing' | 'uploading' | 'completed' | 'error';
  progress: number;
  message?: string;
  error?: string;
  metadata?: VideoMetadata;
  thumbnail?: string;
}

export function VideoUpload({ workspaceId, onUploadComplete, onUploadError }: VideoUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      await processFile(videoFile);
    } else {
      setUploadState({
        status: 'error',
        progress: 0,
        error: 'Please select a video file'
      });
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setUploadState({ status: 'processing', progress: 0, message: 'Analyzing video...' });

    try {
      // Initialize video processor
      await videoProcessor.initialize();

      // Validate video file
      setUploadState({ status: 'processing', progress: 10, message: 'Validating video...' });
      const validation = await videoProcessor.validateVideoFile(file);
      
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Extract metadata
      setUploadState({ status: 'processing', progress: 30, message: 'Extracting metadata...' });
      const metadata = await videoProcessor.extractMetadata(file);

      // Generate thumbnail
      setUploadState({ status: 'processing', progress: 50, message: 'Generating thumbnail...' });
      const thumbnailBlob = await videoProcessor.generateThumbnail(file, metadata.duration * 0.1);
      const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

      setUploadState({
        status: 'processing',
        progress: 70,
        message: 'Preparing upload...',
        metadata,
        thumbnail: thumbnailUrl
      });

      // Initialize upload
      await initiateUpload(file, metadata);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process video';
      setUploadState({
        status: 'error',
        progress: 0,
        error: errorMessage
      });
      onUploadError?.(errorMessage);
    }
  };

  const initiateUpload = async (file: File, metadata: VideoMetadata) => {
    try {
      const uploadRequest: UploadInitiateRequest = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          workspaceId,
          tags: []
        }
      };

      setUploadState(prev => ({
        ...prev,
        progress: 80,
        message: 'Starting upload...'
      }));

      const response = await fetch('/api/v2/video/upload/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResponse: UploadInitiateResponse = await response.json();

      // For demo purposes, we'll simulate upload completion
      setUploadState({
        status: 'completed',
        progress: 100,
        message: 'Upload completed successfully!',
        metadata,
        thumbnail: uploadState.thumbnail
      });

      onUploadComplete?.(uploadResponse.project.id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        status: 'error',
        progress: 0,
        error: errorMessage
      });
      onUploadError?.(errorMessage);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadState({ status: 'idle', progress: 0 });
    if (uploadState.thumbnail) {
      URL.revokeObjectURL(uploadState.thumbnail);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {uploadState.status === 'idle' && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Upload your video
              </h3>
              <p className="text-gray-600 mt-1">
                Drag and drop your video file here, or click to browse
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Supports MP4, MOV, WebM, AVI, MKV</p>
              <p>Maximum file size: 5GB</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {(uploadState.status === 'processing' || uploadState.status === 'uploading') && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Film className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{selectedFile?.name}</h4>
              <p className="text-sm text-gray-600">{uploadState.message}</p>
              
              {/* Progress bar */}
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{uploadState.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>

              {/* Metadata display */}
              {uploadState.metadata && (
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-1 font-medium">
                      {formatDuration(uploadState.metadata.duration)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Resolution:</span>
                    <span className="ml-1 font-medium">
                      {uploadState.metadata.width}x{uploadState.metadata.height}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <span className="ml-1 font-medium">
                      {formatFileSize(selectedFile?.size || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Frame Rate:</span>
                    <span className="ml-1 font-medium">
                      {uploadState.metadata.frameRate.toFixed(1)} fps
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          {uploadState.thumbnail && (
            <div className="mt-4">
              <img 
                src={uploadState.thumbnail} 
                alt="Video thumbnail"
                className="w-32 h-18 object-cover rounded border"
              />
            </div>
          )}
        </div>
      )}

      {uploadState.status === 'completed' && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Upload completed!</h4>
              <p className="text-sm text-gray-600">
                Your video has been successfully uploaded and is ready for editing.
              </p>
              
              {uploadState.thumbnail && (
                <div className="mt-3">
                  <img 
                    src={uploadState.thumbnail} 
                    alt="Video thumbnail"
                    className="w-32 h-18 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            <button
              onClick={resetUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {uploadState.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Upload failed</h4>
              <p className="text-sm text-red-700 mt-1">
                {uploadState.error}
              </p>
              <button
                onClick={resetUpload}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}