'use client'

import Link from 'next/link'
import { VideoUpload } from '@/components/video-upload'
import { JobList } from '@/components/job-status'
import { TranscriptEditor } from '@/components/transcript-editor'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Project Chimera</h1>
          <p className="text-lg text-gray-600 mb-6">
            Video processing and transcript editing platform
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/demo" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Demo
            </Link>
            <a 
              href="https://github.com/WeBeCodin/Project-Chimera" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              View Source
            </a>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className="mb-12">
          <VideoUpload 
            projectId="demo-project" // In a real app, this would come from routing or context
            onUploadComplete={(video, job) => {
              console.log('Upload completed:', { video, job })
              // Here you would typically refresh job list or update state
            }}
            onError={(error) => {
              console.error('Upload error:', error)
              // Here you would show error notification
            }}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Features Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Features</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <div>
                  <h3 className="font-medium">Video Upload & Processing</h3>
                  <p className="text-sm text-gray-600">Drag-and-drop, file select, and URL ingestion</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <div>
                  <h3 className="font-medium">AWS S3 Storage</h3>
                  <p className="text-sm text-gray-600">Secure cloud storage with pre-signed URLs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <div>
                  <h3 className="font-medium">Step Functions Orchestration</h3>
                  <p className="text-sm text-gray-600">Automated transcription and analysis pipeline</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                <div>
                  <h3 className="font-medium">Real-time Job Status</h3>
                  <p className="text-sm text-gray-600">Live polling and progress tracking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Architecture</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">Frontend</h3>
                <p className="text-sm text-gray-600">Next.js with React & TypeScript</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">Backend</h3>
                <p className="text-sm text-gray-600">Vercel Functions with Prisma ORM</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">Infrastructure</h3>
                <p className="text-sm text-gray-600">AWS CDK with S3, Lambda & Step Functions</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">Shared Libraries</h3>
                <p className="text-sm text-gray-600">TypeScript types with Zod validation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Status Section - Placeholder for now */}
        <div className="mt-12">
          <div className="bg-white rounded-lg border p-6">
            <JobList 
              jobs={[]} // In a real app, this would come from API
              loading={false}
              error={null}
              onRefresh={() => {
                console.log('Refresh jobs')
                // Here you would refetch jobs
              }}
            />
          </div>
        </div>

        {/* Transcript Editor Section */}
        <div className="mt-12">
          <div className="bg-white rounded-lg border p-6">
            <TranscriptEditor />
          </div>
        </div>

        <footer className="text-center text-sm text-gray-500 pt-12 mt-12 border-t">
          <p>Built with Turborepo monorepo architecture</p>
        </footer>
      </div>
    </div>
  );
}
