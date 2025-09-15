'use client';

/**
 * Enhanced Video Upload Component
 * Handles chunked video upload with Vercel Blob integration
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, Film, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { videoProcessor } from '@/lib/video/processor';
import type { UploadInitiateRequest, UploadInitiateResponse, VideoMetadata } from '@/lib/video/types';

interface VideoUploadProps {
  workspaceId: string;
  onUploadComplete?: (projectId: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadState {
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
  error?: string;
  metadata?: VideoMetadata;
  thumbnail?: string;
  projectId?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const SUPPORTED_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm', 
  'video/avi',
  'video/x-msvideo',
  'video/mkv',
  'video/x-matroska'
];

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
    const videoFile = files.find(file => SUPPORTED_TYPES.includes(file.type));

    if (videoFile) {
      await handleFileSelect(videoFile);
    } else {
      const error = 'Please select a supported video file (MP4, MOV, WebM, AVI, MKV)';
      setUploadState(prev => ({ ...prev, status: 'error', error }));
      onUploadError?.(error);
    }
  }, [onUploadError]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      const error = `Unsupported file type: ${file.type}`;
      setUploadState(prev => ({ ...prev, status: 'error', error }));
      onUploadError?.(error);
      return;
    }

    if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB limit
      const error = 'File size exceeds 5GB limit';
      setUploadState(prev => ({ ...prev, status: 'error', error }));
      onUploadError?.(error);
      return;
    }

    setSelectedFile(file);
    setUploadState({ status: 'validating', progress: 0, message: 'Validating video file...' });

    try {
      // Validate and extract metadata
      const validation = await videoProcessor.validateVideoFile(file);
      
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const metadata = await videoProcessor.extractMetadata(file);
      const thumbnailBlob = await videoProcessor.generateThumbnail(file, 0);
      const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

      setUploadState(prev => ({
        ...prev,
        status: 'idle',
        progress: 0,
        metadata,
        thumbnail: thumbnailUrl,
        message: 'Ready to upload'
      }));

    } catch (error) {
      console.error('File validation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate video';
      setUploadState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onUploadError?.(errorMessage);
    }
  }, [onUploadError]);

  const initiateUpload = async (): Promise<UploadInitiateResponse> => {
    if (!selectedFile) throw new Error('No file selected');

    const request: UploadInitiateRequest = {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      metadata: {
        title: selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
        workspaceId,
      }
    };

    const response = await fetch('/api/v2/video/upload/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to initiate upload: ${error}`);
    }

    return response.json();
  };

  const uploadChunk = async (
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    uploadId: string,
    projectId: string
  ) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('projectId', projectId);

    const response = await fetch('/api/v2/video/upload/chunk', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload chunk ${chunkIndex}: ${error}`);
    }

    return response.json();
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setUploadState(prev => ({ 
        ...prev, 
        status: 'uploading', 
        progress: 0, 
        message: 'Initiating upload...' 
      }));

      // Step 1: Initiate upload
      const uploadResponse = await initiateUpload();
      const { uploadId, project } = uploadResponse;
      
      setUploadState(prev => ({ 
        ...prev, 
        projectId: project.id,
        message: 'Uploading video...' 
      }));

      // Step 2: Upload file in chunks
      const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
      
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
        const chunk = selectedFile.slice(start, end);

        await uploadChunk(chunk, chunkIndex, totalChunks, uploadId, project.id);

        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadState(prev => ({
          ...prev,
          progress,
          message: `Uploading... ${progress}%`
        }));
      }

      // Step 3: Upload completed, processing will begin
      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 100,
        message: 'Upload complete! Processing video...'
      }));

      // Wait a moment then mark as completed
      setTimeout(() => {
        setUploadState(prev => ({
          ...prev,
          status: 'completed',
          message: 'Video uploaded and processing started!'
        }));
        
        onUploadComplete?.(project.id);
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onUploadError?.(errorMessage);
    }
  }, [selectedFile, workspaceId, onUploadComplete, onUploadError]);

  const resetUpload = useCallback(() => {
    setSelectedFile(null);
    setUploadState({ status: 'idle', progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const isUploading = uploadState.status === 'uploading' || uploadState.status === 'processing';
  const canUpload = selectedFile && uploadState.status === 'idle' && !isUploading;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {selectedFile ? (
          <div className="space-y-4">
            {/* Video Thumbnail */}
            {uploadState.thumbnail && (
              <div className="w-32 h-18 mx-auto rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={uploadState.thumbnail} 
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* File Info */}
            <div className="flex items-center justify-center space-x-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="text-left">
                <p className="text-lg font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  {uploadState.metadata && (
                    <> • {Math.round(uploadState.metadata.duration)}s • {uploadState.metadata.width}×{uploadState.metadata.height}</>
                  )}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                disabled={isUploading}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Film className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Your Video
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your video file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports MP4, MOV, WebM, AVI, MKV • Up to 5GB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {canUpload && (
        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Video</span>
        </button>
      )}

      {/* Progress and Status */}
      {(uploadState.status !== 'idle' && uploadState.message) && (
        <div className={`
          p-6 rounded-lg border
          ${uploadState.status === 'error' 
            ? 'bg-red-50 border-red-200' 
            : uploadState.status === 'completed'
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
          }
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {uploadState.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : uploadState.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
              <span className={`font-medium ${
                uploadState.status === 'error' ? 'text-red-700' :
                uploadState.status === 'completed' ? 'text-green-700' :
                'text-blue-700'
              }`}>
                {uploadState.message}
              </span>
            </div>
            {uploadState.progress > 0 && uploadState.status !== 'completed' && (
              <span className="text-sm text-gray-600">
                {uploadState.progress}%
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {uploadState.progress > 0 && uploadState.status !== 'completed' && uploadState.status !== 'error' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          )}

          {/* Error Details */}
          {uploadState.error && (
            <p className="text-sm text-red-600 mt-2">{uploadState.error}</p>
          )}

          {/* Success Actions */}
          {uploadState.status === 'completed' && uploadState.projectId && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-green-600">
                Project ID: <span className="font-mono">{uploadState.projectId}</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.href = `/editor/${uploadState.projectId}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  Open in Editor
                </button>
                <button
                  onClick={resetUpload}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
                >
                  Upload Another Video
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}