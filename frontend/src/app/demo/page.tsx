'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VideoUpload } from '@/components/video-upload'
import { JobList } from '@/components/job-status'
import { TranscriptEditor } from '@/components/transcript-editor'
import { AnalysisResultsDisplay } from '@/components/analysis-results-display'

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

const DEMO_PROJECT_ID = 'demo-project-123'

export default function ProjectPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [currentView, setCurrentView] = useState<'jobs' | 'analysis'>('jobs')
  const [analysisResults, setAnalysisResults] = useState<Record<string, unknown> | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Function to fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/jobs?projectId=${DEMO_PROJECT_ID}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      const jobsData = await response.json()
      setJobs(jobsData)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  // Initial load and periodic refresh
  useEffect(() => {
    fetchJobs()
    
    // Set up polling for job status updates
    const interval = setInterval(() => {
      fetchJobs()
    }, 10000) // Poll every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  const handleUploadComplete = (video: Record<string, unknown>, job: Record<string, unknown>) => {
    console.log('Upload completed:', { video, job })
    
    // Show success notification
    setNotification({
      type: 'success',
      message: `Video "${video.filename}" uploaded successfully! Processing job created.`
    })
    
    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000)
    
    // Immediately refresh jobs to show the new job
    fetchJobs()
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
              <p className="text-gray-600 mt-1">Video processing and transcript editing platform</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="px-3 py-2 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Admin Panel
              </Link>
              <div className="text-sm text-gray-500">
                Project ID: <code className="bg-gray-100 px-2 py-1 rounded">{DEMO_PROJECT_ID}</code>
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
            projectId={DEMO_PROJECT_ID}
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              {currentView === 'jobs' ? (
                <JobList 
                  jobs={jobs}
                  loading={loading}
                  error={error}
                  onRefresh={fetchJobs}
                  onViewResults={handleViewResults}
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
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm">S3 Pre-signed Upload URLs</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm">Step Functions Orchestration</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-sm">Real-time Job Polling</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-sm">Drag & Drop Upload</span>
                </div>
              </div>
            </div>

            {/* Architecture */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Architecture</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Frontend</div>
                  <div className="text-gray-600">Next.js + TypeScript</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Backend</div>
                  <div className="text-gray-600">Vercel Functions + Prisma</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Infrastructure</div>
                  <div className="text-gray-600">AWS CDK + S3 + Lambda</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Orchestration</div>
                  <div className="text-gray-600">Step Functions</div>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Job Status Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                  <span>PENDING - Waiting to start</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span>
                  <span>RUNNING - Currently processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-green-500 rounded"></span>
                  <span>COMPLETED - Successfully finished</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-red-500 rounded"></span>
                  <span>FAILED - Processing error</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
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
          <div className="text-center text-sm text-gray-500">
            <p>Built with Turborepo monorepo architecture • AWS CDK • Next.js • Vercel Functions</p>
          </div>
        </div>
      </footer>
    </div>
  )
}