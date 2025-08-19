'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Server, Database, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface Job {
  id: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  video?: {
    filename: string
  }
}

interface AdminStats {
  totalJobs: number
  runningJobs: number
  completedJobs: number
  failedJobs: number
  recentJobs: Job[]
}

export function AdminMonitoringPanel() {
  const [stats, setStats] = useState<AdminStats>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    recentJobs: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all jobs to calculate stats
      const response = await fetch('/api/jobs')
      
      if (!response.ok) {
        throw new Error('Failed to fetch job statistics')
      }
      
      const jobs = await response.json()
      
      const statsData = {
        totalJobs: jobs.length,
        runningJobs: jobs.filter((job: Job) => job.status === 'RUNNING').length,
        completedJobs: jobs.filter((job: Job) => job.status === 'COMPLETED').length,
        failedJobs: jobs.filter((job: Job) => job.status === 'FAILED').length,
        recentJobs: jobs.slice(0, 10) // Get 10 most recent jobs
      }
      
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching admin stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchStats, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'RUNNING':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />
      case 'FAILED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-700 bg-green-100'
      case 'RUNNING': return 'text-blue-700 bg-blue-100'
      case 'PENDING': return 'text-yellow-700 bg-yellow-100'
      case 'FAILED': return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Monitoring</h1>
          <p className="text-gray-600">System overview and job monitoring</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Running</p>
              <p className="text-2xl font-bold text-gray-900">{stats.runningJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failedJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
        </div>
        <div className="p-6">
          {stats.recentJobs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-medium">
                        {job.type} - {job.video?.filename || 'Unknown Video'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {job.id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <div className="text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No jobs found</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">API Status</div>
                <div className="text-sm text-green-600">Operational</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Database</div>
                <div className="text-sm text-green-600">Connected</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Server className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">Infrastructure</div>
                <div className="text-sm text-blue-600">Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}