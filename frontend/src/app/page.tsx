/**
 * Home Page - Project Chimera
 * AI-Powered Video Editor Landing Page
 * Supercharger Manifesto v3.0 Compliant
 */

import Link from 'next/link';
import { Film, Sparkles, ArrowRight, Play, Edit, Download } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                <Film className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Project <span className="text-blue-600">Chimera</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The AI-powered video editing platform that transforms your raw footage into 
              professional videos with intelligent automation and real-time collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/editor"
                className="group px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                <span>Start Editing</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/demo"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-white transition-all duration-200 flex items-center space-x-2 text-lg"
              >
                <Play className="w-5 h-5" />
                <span>View Demo</span>
              </Link>
            </div>

            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>AI-Enhanced</span>
              </div>
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4" />
                <span>Professional Tools</span>
              </div>
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Real-time Editing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Video Editing, Powered by AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From upload to export, every step is enhanced with intelligent automation 
              while maintaining full creative control.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature 1: Upload & Processing */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Film className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Smart Upload & Processing
              </h3>
              <p className="text-gray-600 mb-6">
                Drag and drop videos up to 5GB. Our AI automatically analyzes your footage, 
                detects scenes, and generates thumbnails for instant editing.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Supports MP4, MOV, WebM, AVI, MKV</li>
                <li>• Automatic scene detection</li>
                <li>• Real-time progress tracking</li>
                <li>• Thumbnail generation</li>
              </ul>
            </div>

            {/* Feature 2: Timeline Editor */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Edit className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Professional Timeline Editor
              </h3>
              <p className="text-gray-600 mb-6">
                Frame-accurate editing with multi-track timeline, professional shortcuts, 
                and real-time preview. Built for creators who demand precision.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Frame-accurate cutting</li>
                <li>• Multi-track editing</li>
                <li>• Keyboard shortcuts</li>
                <li>• Real-time effects</li>
              </ul>
            </div>

            {/* Feature 3: AI Assistant */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI Editing Assistant
              </h3>
              <p className="text-gray-600 mb-6">
                Get intelligent suggestions for cuts, transitions, and effects. Auto-generate 
                captions, remove silence, and create platform-optimized clips.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Auto transcription & captions</li>
                <li>• Smart cut suggestions</li>
                <li>• Platform optimization</li>
                <li>• Automated workflows</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Create Amazing Videos?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join creators who are already using AI to enhance their video editing workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/editor"
              className="group px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold"
            >
              <span>Start Editing Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
