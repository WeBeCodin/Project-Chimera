'use client'

import { AdminMonitoringPanel } from '@/components/admin-monitoring'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/demo"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Demo
              </Link>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-orange-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-gray-600 mt-1">System monitoring and job management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminMonitoringPanel />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Project Chimera Admin Panel • Built with Next.js & AWS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}