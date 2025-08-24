'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Upload, File, Link2, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface VideoUploadProps {
  projectId: string
  onUploadComplete?: (video: Record<string, unknown>, job: Record<string, unknown>) => void
  onError?: (error: string) => void
}

interface UploadProgress {
  percentage: number
  stage: 'requesting-url' | 'uploading' | 'completing' | 'done' | 'error'
  message: string
}

const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogg',
  'video/avi': '.avi',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
}

export function VideoUpload({ projectId, onUploadComplete, onError }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => Object.keys(ACCEPTED_VIDEO_TYPES).includes(file.type))
    
    if (videoFile) {
      setSelectedFile(videoFile)
      setUploadMode('file')
    } else {
      onError?.('Please select a valid video file')
    }
  }, [onError])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && Object.keys(ACCEPTED_VIDEO_TYPES).includes(file.type)) {
      setSelectedFile(file)
      setUploadMode('file')
    } else {
      onError?.('Please select a valid video file')
    }
  }, [onError])

  const uploadFileToBlob = async (file: File, blobKey: string) => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100)
          setUploadProgress({
            percentage,
            stage: 'uploading',
            message: `Uploading... ${percentage}%`
          })
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response.url)
          } catch (error) {
            reject(new Error('Invalid response from server'))
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })
      
      // Build the URL with query parameters for blob upload
      const uploadUrl = `/api/videos/blob-upload?blobKey=${encodeURIComponent(blobKey)}&projectId=${encodeURIComponent(projectId)}&filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
      
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    try {
      setUploadProgress({
        percentage: 0,
        stage: 'requesting-url',
        message: 'Preparing upload...'
      })

      // Step 1: Get blob upload info
      const uploadUrlResponse = await fetch('/api/videos/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
          projectId,
        }),
      })

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { blobKey } = await uploadUrlResponse.json()

      // Step 2: Upload file to Vercel Blob
      const blobUrl = await uploadFileToBlob(selectedFile, blobKey)

      setUploadProgress({
        percentage: 100,
        stage: 'completing',
        message: 'Completing upload...'
      })

      // Step 3: Notify backend of successful upload
      const completeResponse = await fetch('/api/videos/upload-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blobUrl,
          blobKey,
          projectId,
          filename: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
        }),
      })

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload')
      }

      const result = await completeResponse.json()

      setUploadProgress({
        percentage: 100,
        stage: 'done',
        message: 'Upload completed successfully!'
      })

      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setUploadProgress(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)

      onUploadComplete?.(result.video, result.transcriptionJob)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadProgress({
        percentage: 0,
        stage: 'error',
        message: errorMessage
      })
      onError?.(errorMessage)
      
      // Reset error state after 5 seconds
      setTimeout(() => {
        setUploadProgress(null)
      }, 5000)
    }
  }

  const handleUrlUpload = async () => {
    if (!videoUrl.trim()) return

    try {
      setUploadProgress({
        percentage: 0,
        stage: 'requesting-url',
        message: 'Processing video URL...'
      })

      // For URL ingestion, we'll create the video record directly
      // In a real implementation, you might want to validate the URL first
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: videoUrl.split('/').pop() || 'video.mp4',
          originalUrl: videoUrl,
          projectId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process video URL')
      }

      const result = await response.json()

      setUploadProgress({
        percentage: 100,
        stage: 'done',
        message: 'Video URL processed successfully!'
      })

      // Reset form
      setTimeout(() => {
        setVideoUrl('')
        setUploadProgress(null)
      }, 2000)

      onUploadComplete?.(result.video, result.transcriptionJob)
    } catch (error) {
      console.error('URL processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process video URL'
      setUploadProgress({
        percentage: 0,
        stage: 'error',
        message: errorMessage
      })
      onError?.(errorMessage)
      
      setTimeout(() => {
        setUploadProgress(null)
      }, 5000)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setVideoUrl('')
    setUploadProgress(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isUploading = uploadProgress?.stage === 'requesting-url' || 
                     uploadProgress?.stage === 'uploading' || 
                     uploadProgress?.stage === 'completing'

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-6">Upload Video</h2>
      
      {/* Upload Mode Selector */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => {
            setUploadMode('file')
            setVideoUrl('')
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            uploadMode === 'file' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
          disabled={isUploading}
        >
          <File className="inline w-4 h-4 mr-2" />
          Upload File
        </button>
        <button
          onClick={() => {
            setUploadMode('url')
            setSelectedFile(null)
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            uploadMode === 'url' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
          disabled={isUploading}
        >
          <Link2 className="inline w-4 h-4 mr-2" />
          Video URL
        </button>
      </div>

      {uploadMode === 'file' ? (
        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={Object.values(ACCEPTED_VIDEO_TYPES).join(',')}
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-lg font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearSelection()
                  }}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your video file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports: MP4, WebM, OGG, AVI, MOV files up to 500MB
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <button
              onClick={handleFileUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="inline w-4 h-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-2">
              Video URL
            </label>
            <input
              id="video-url"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isUploading}
            />
          </div>

          {/* URL Upload Button */}
          {videoUrl.trim() && (
            <button
              onClick={handleUrlUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="inline w-4 h-4 mr-2" />
              )}
              {isUploading ? 'Processing...' : 'Process Video URL'}
            </button>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {uploadProgress && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {uploadProgress.message}
            </span>
            <span className="text-sm text-gray-500">
              {uploadProgress.stage === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : uploadProgress.stage === 'done' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </span>
          </div>
          
          {uploadProgress.stage !== 'error' && uploadProgress.stage !== 'done' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          )}
          
          {uploadProgress.stage === 'error' && (
            <div className="text-sm text-red-600 mt-2">
              {uploadProgress.message}
            </div>
          )}
          
          {uploadProgress.stage === 'done' && (
            <div className="text-sm text-green-600 mt-2">
              {uploadProgress.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}