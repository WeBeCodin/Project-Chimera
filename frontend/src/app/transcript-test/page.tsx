'use client'

import React, { useEffect, useState } from 'react'
import { VideoTranscriptSync } from '@/components/video-transcript-sync'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface TranscriptSegment {
  start: number
  end: number
  text: string
  confidence: number
}

interface TranscriptData {
  text: string
  duration: number
  language: string
  segments: TranscriptSegment[]
  confidence: number
}

interface Job {
  id: string
  status: string
  projectId: string
  outputData?: {
    transcription?: TranscriptData
  }
}

interface Video {
  id: string
  sourceUrl: string
  title: string
}

export default function TranscriptTestPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [jobsRes, videosRes] = await Promise.all([
        fetch('/api/jobs?projectId=test'),
        fetch('/api/videos/list')
      ])
      
      const jobsData = await jobsRes.json()
      const videosData = await videosRes.json()
      
      // Filter for completed jobs with transcription data
      const completedJobs = jobsData.jobs.filter((j: Job) => 
        j.status === 'COMPLETED' && j.outputData?.transcription
      )
      
      setJobs(completedJobs)
      setVideos(videosData.videos)
      
      // Auto-select first completed job
      if (completedJobs.length > 0) {
        setSelectedJobId(completedJobs[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId)
  const selectedVideo = selectedJob ? videos.find(v => v.id === selectedJob.projectId) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transcript data...</p>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Link href="/projects" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft size={20} />
          Back to Projects
        </Link>
        
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Transcript Data Available</h1>
          <p className="text-gray-600 mb-6">
            No completed jobs with transcription data found. Upload and process a video first.
          </p>
          <Link 
            href="/projects" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload Video
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/projects" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft size={20} />
          Back to Projects
        </Link>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transcript Editor Test</h1>
          <p className="text-gray-600">
            Click transcript segments to seek video. Active segment highlights during playback.
          </p>
        </div>

        {/* Job Selector */}
        {jobs.length > 1 && (
          <div className="mb-6 bg-white border rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Job:
            </label>
            <select
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.id} - {job.status}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video + Transcript Viewer */}
        {selectedJob && selectedVideo && selectedJob.outputData?.transcription && (
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <VideoTranscriptSync
              videoUrl={selectedVideo.sourceUrl}
              transcript={selectedJob.outputData.transcription}
            />
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-6 bg-gray-100 border rounded-lg p-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Debug Info:</h3>
          <pre className="text-xs text-gray-600 overflow-auto max-h-48">
            {JSON.stringify({
              totalJobs: jobs.length,
              selectedJobId,
              hasVideo: !!selectedVideo,
              hasTranscript: !!selectedJob?.outputData?.transcription,
              segmentCount: selectedJob?.outputData?.transcription?.segments.length || 0
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
