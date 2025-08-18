'use client'

import React from 'react'
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2, PlayCircle } from 'lucide-react'

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

interface JobStatusProps {
  job: Job
  showDetails?: boolean
  onViewResults?: (videoId: string) => void
}

const statusIcons = {
  PENDING: Clock,
  RUNNING: Loader2,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  CANCELLED: AlertCircle,
}

const statusColors = {
  PENDING: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  RUNNING: 'text-blue-500 bg-blue-50 border-blue-200',
  COMPLETED: 'text-green-500 bg-green-50 border-green-200',
  FAILED: 'text-red-500 bg-red-50 border-red-200',
  CANCELLED: 'text-gray-500 bg-gray-50 border-gray-200',
}

export function JobStatus({ job, showDetails = false, onViewResults }: JobStatusProps) {
  const StatusIcon = statusIcons[job.status]
  const statusColorClass = statusColors[job.status]

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getDuration = () => {
    if (!job.startedAt) return null
    const start = new Date(job.startedAt)
    const end = job.completedAt ? new Date(job.completedAt) : new Date()
    const durationMs = end.getTime() - start.getTime()
    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${statusColorClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusIcon 
            className={`w-5 h-5 ${job.status === 'RUNNING' ? 'animate-spin' : ''}`}
          />
          <div>
            <h3 className="font-medium capitalize">
              {job.type} Job
            </h3>
            <p className="text-sm opacity-75">
              {job.video?.filename || 'Video processing'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
            {job.status}
          </span>
          {getDuration() && (
            <p className="text-xs opacity-75 mt-1">
              Duration: {getDuration()}
            </p>
          )}
          {job.status === 'COMPLETED' && job.video?.id && onViewResults && (
            <button
              onClick={() => onViewResults(job.video!.id)}
              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Results
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="font-medium opacity-75">Job ID</dt>
              <dd className="mt-1 font-mono text-xs">{job.id}</dd>
            </div>
            <div>
              <dt className="font-medium opacity-75">Created</dt>
              <dd className="mt-1">{formatDate(job.createdAt)}</dd>
            </div>
            {job.startedAt && (
              <div>
                <dt className="font-medium opacity-75">Started</dt>
                <dd className="mt-1">{formatDate(job.startedAt)}</dd>
              </div>
            )}
            {job.completedAt && (
              <div>
                <dt className="font-medium opacity-75">Completed</dt>
                <dd className="mt-1">{formatDate(job.completedAt)}</dd>
              </div>
            )}
          </dl>

          {job.error && (
            <div className="mt-3">
              <dt className="font-medium opacity-75">Error</dt>
              <dd className="mt-1 text-sm bg-red-100 text-red-800 p-2 rounded">
                {job.error}
              </dd>
            </div>
          )}

          {job.result && (
            <div className="mt-3">
              <dt className="font-medium opacity-75">Result</dt>
              <dd className="mt-1">
                <pre className="text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto">
                  {JSON.stringify(job.result, null, 2)}
                </pre>
              </dd>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface JobListProps {
  jobs: Job[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onViewResults?: (videoId: string) => void
}

export function JobList({ jobs, loading, error, onRefresh, onViewResults }: JobListProps) {
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Jobs</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading jobs...</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Yet</h3>
        <p className="text-gray-500">Upload a video to create your first processing job.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Processing Jobs ({jobs.length})
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
          >
            Refresh
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobStatus key={job.id} job={job} showDetails onViewResults={onViewResults} />
        ))}
      </div>
    </div>
  )
}