'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VideoUpload } from '@/components/video-upload'
import { JobList } from '@/components/job-status'
import { VideoGallery } from '@/components/video-gallery'
import { TranscriptEditor } from '@/components/transcript-editor'
import { AnalysisResultsDisplay } from '@/components/analysis-results-display'

interface VideoAnalysisResult {
  video: {
    id: string
    filename: string
    originalUrl: string
    duration?: number
  }
  transcription: Record<string, unknown>
  detection: Record<string, unknown>
  summarization: Record<string, unknown>
  jobs: Array<Record<string, unknown>>
}

interface Job {
  id: string
  type: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
  error?: string | null
  metadata?: Record<string, unknown>
  result?: Record<string, unknown>
  video?: {
    id: string
    filename: string
  }
  project?: {
    id: string
    name: string
  }
}

// Generate a project ID on first load (client-side only)
function getOrCreateProjectId(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem('currentProjectId');
  if (stored) return stored;
  
  // Generate new UUID v4
  const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  
  localStorage.setItem('currentProjectId', newId);
  return newId;
}

export default function ProjectPage() {
  const [projectId, setProjectId] = useState<string>('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [videosLoading, setVideosLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [currentView, setCurrentView] = useState<'videos' | 'jobs' | 'analysis'>('videos')
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [localJobs, setLocalJobs] = useState<Job[]>([]) // Store locally created jobs

  // Initialize project ID on mount
  useEffect(() => {
    setProjectId(getOrCreateProjectId());
  }, []);

  // Function to fetch videos from API
  const fetchVideos = async () => {
    try {
      setVideosLoading(true)
      const response = await fetch('/api/videos/list')
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
    } finally {
      setVideosLoading(false)
    }
  }

  // Load videos on mount and refresh periodically
  useEffect(() => {
    fetchVideos()
    const interval = setInterval(fetchVideos, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Function to fetch jobs from API
  const fetchJobs = async (silent = false) => {
    if (!projectId) return; // Wait for project ID to be set
    
    try {
      if (!silent) setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/jobs?projectId=${projectId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      const data = await response.json()
      const apiJobs = data.jobs || []
      
      // Merge API jobs with local jobs, API jobs take precedence for status updates
      const jobMap = new Map<string, Job>()
      
      // Add local jobs first
      localJobs.forEach(job => jobMap.set(job.id, job))
      
      // Override with API jobs (they have updated status)
      apiJobs.forEach((job: Job) => jobMap.set(job.id, job))
      
      const mergedJobs = Array.from(jobMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setJobs(mergedJobs)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Initial load and periodic refresh
  useEffect(() => {
    fetchJobs()
    
    // Set up polling for job status updates (silent to avoid UI flicker)
    const interval = setInterval(() => {
      fetchJobs(true)
    }, 2000) // Poll every 2 seconds for responsive updates
    
    return () => clearInterval(interval)
  }, [localJobs])

  const handleUploadComplete = async (video: Record<string, unknown>, job: Record<string, unknown>) => {
    console.log('Upload completed:', { video, job })
    
    // Show success notification
    setNotification({
      type: 'success',
      message: `Video "${video.filename}" uploaded successfully! Processing started...`
    })
    
    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000)
    
    // Add the new job to the local jobs state (optimistic update)
    // This persists across polling refreshes
    const newJob: Job = {
      id: job.id as string,
      type: job.type as string,
      status: 'PENDING',
      createdAt: job.createdAt as string,
      startedAt: null,
      completedAt: null,
      video: {
        id: video.id as string,
        filename: video.filename as string
      },
      project: {
        id: projectId,
        name: 'Video Project'
      }
    }
    
    // Add to local jobs so it persists across polling
    setLocalJobs(prev => [newJob, ...prev])
    
    // Add to displayed jobs immediately
    setJobs(prevJobs => [newJob, ...prevJobs])

    // Automatically trigger processing
    try {
      const response = await fetch(`/api/jobs/${job.id}/process`, {
        method: 'POST'
      })
      
      if (response.ok) {
        console.log('Processing started for job:', job.id)
        
        // Immediately update the job status to RUNNING in the UI
        setJobs(prevJobs => 
          prevJobs.map(j => 
            j.id === job.id 
              ? { ...j, status: 'RUNNING', startedAt: new Date().toISOString() }
              : j
          )
        )
        
        // Poll immediately to get latest status
        setTimeout(() => fetchJobs(true), 500)
      }
    } catch (error) {
      console.error('Failed to start processing:', error)
    }
  }

  const handleStartProcessing = async (jobId: string) => {
    try {
      // Immediately update UI to show RUNNING status
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === jobId 
            ? { ...j, status: 'RUNNING', startedAt: new Date().toISOString() }
            : j
        )
      )
      
      const response = await fetch(`/api/jobs/${jobId}/process`, {
        method: 'POST'
      })
      
      if (response.ok) {
        console.log('Processing started for job:', jobId)
        setNotification({
          type: 'success',
          message: 'Processing started!'
        })
        setTimeout(() => setNotification(null), 3000)
        
        // Refresh jobs after a short delay
        setTimeout(() => fetchJobs(true), 500)
      } else {
        throw new Error('Failed to start processing')
      }
    } catch (error) {
      console.error('Failed to start processing:', error)
      setNotification({
        type: 'error',
        message: 'Failed to start processing. Please try again.'
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleUploadError = (errorMessage: string) => {
    console.error('Upload error:', errorMessage)
    
    setNotification({
      type: 'error',
      message: `Upload failed: ${errorMessage}`
    })
    
    // Clear notification after 8 seconds for errors
    setTimeout(() => setNotification(null), 8000)
  }

  const handleViewResults = async (videoId: string) => {
    try {
      setAnalysisLoading(true)
      setCurrentView('analysis')
      
      const response = await fetch(`/api/videos/${videoId}/analysis`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis results')
      }
      
      const results = await response.json()
      setAnalysisResults(results)
    } catch (err) {
      console.error('Error fetching analysis results:', err)
      setNotification({
        type: 'error',
        message: `Failed to load analysis results: ${err instanceof Error ? err.message : 'Unknown error'}`
      })
      setTimeout(() => setNotification(null), 8000)
      setCurrentView('jobs') // Go back to jobs view on error
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleBackToJobs = () => {
    setCurrentView('jobs')
    setAnalysisResults(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Chimera</h1>
              <p className="text-gray-900 mt-1 font-medium">Video Processing & Transcript Editing Platform</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="px-3 py-2 text-sm font-semibold text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Admin Panel
              </Link>
              <div className="text-sm text-gray-900">
                Project ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{projectId || 'Loading...'}</code>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Upload Section */}
        <div className="mb-12">
          <VideoUpload 
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCurrentView('videos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'videos'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Videos ({videos.length})
          </button>
          <button
            onClick={() => setCurrentView('jobs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Processing Jobs ({jobs.length})
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              {currentView === 'videos' ? (
                <VideoGallery
                  videos={videos}
                  loading={videosLoading}
                  onVideoClick={handleViewResults}
                />
              ) : currentView === 'jobs' ? (
                <JobList 
                  jobs={jobs}
                  loading={loading}
                  error={error}
                  onRefresh={fetchJobs}
                  onViewResults={handleViewResults}
                  onStartProcessing={handleStartProcessing}
                />
              ) : currentView === 'analysis' ? (
                <AnalysisResultsDisplay
                  result={analysisResults}
                  loading={analysisLoading}
                  onBack={handleBackToJobs}
                />
              ) : null}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Features */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-900 font-medium">S3 Pre-signed Upload URLs</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm text-gray-900 font-medium">Step Functions Orchestration</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-sm text-gray-900 font-medium">Real-time Job Polling</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-sm text-gray-900 font-medium">Drag & Drop Upload</span>
                </div>
              </div>
            </div>

            {/* Architecture */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Architecture</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">Frontend</div>
                  <div className="text-gray-900">Next.js + TypeScript</div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">Backend</div>
                  <div className="text-gray-900">Vercel Functions + Prisma</div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">Infrastructure</div>
                  <div className="text-gray-900">AWS CDK + S3 + Lambda</div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">Orchestration</div>
                  <div className="text-gray-900">Step Functions</div>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                  <span>PENDING - Waiting to start</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span>
                  <span>RUNNING - Currently processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span className="w-3 h-3 bg-green-500 rounded"></span>
                  <span>COMPLETED - Successfully finished</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span className="w-3 h-3 bg-red-500 rounded"></span>
                  <span>FAILED - Processing error</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span className="w-3 h-3 bg-gray-500 rounded"></span>
                  <span>CANCELLED - Manually stopped</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Editor Section */}
        <div className="mt-12">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <TranscriptEditor />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-900 font-medium">
            <p>Built with Turborepo monorepo architecture • AWS CDK • Next.js • Vercel Functions</p>
          </div>
        </div>
      </footer>
    </div>
  )
}