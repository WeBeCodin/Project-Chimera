/**
 * Video Editor Landing Page
 * Entry point for the AI-powered video editing platform
 */

'use client';

import { useState } from 'react';
import { VideoUpload } from '@/components/video/VideoUploadEnhanced';
import { Film, Sparkles, Zap, Users } from 'lucide-react';

export default function VideoEditor() {
  const [uploadedProject, setUploadedProject] = useState<string | null>(null);

  const handleUploadComplete = (projectId: string) => {
    setUploadedProject(projectId);
    // In a full implementation, this would redirect to the editor
    console.log('Video uploaded successfully, project ID:', projectId);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Chimera</h1>
                <p className="text-sm text-gray-600">AI-Powered Video Editor</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Enhanced</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>Real-time</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Collaborative</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!uploadedProject ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">
                Create Amazing Videos with AI
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload your raw footage and let our AI help you create professional videos with 
                automated editing, smart cuts, and intelligent suggestions.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-6 rounded-lg border text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Scene Detection</h3>
                <p className="text-gray-600 text-sm">
                  Automatically identify scenes, cuts, and highlight moments in your videos
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Transcription</h3>
                <p className="text-gray-600 text-sm">
                  Generate accurate captions and transcripts with speaker identification
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Film className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Professional Timeline</h3>
                <p className="text-gray-600 text-sm">
                  Frame-accurate editing with professional keyboard shortcuts and tools
                </p>
              </div>
            </div>

            {/* Upload Section */}
            <VideoUpload 
              workspaceId="demo-workspace"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />

            {/* Technical Specs */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-4">Platform Capabilities</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div>
                  <div className="font-medium text-gray-900 mb-1">Supported Formats</div>
                  <div className="text-gray-600">MP4, MOV, WebM, AVI, MKV</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Max File Size</div>
                  <div className="text-gray-600">5GB per video</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Resolution Support</div>
                  <div className="text-gray-600">Up to 4K (3840×2160)</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Processing</div>
                  <div className="text-gray-600">Browser-based with WebAssembly</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Post-Upload Success State */
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Film className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Video Uploaded Successfully!
              </h2>
              <p className="text-gray-600">
                Project ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{uploadedProject}</span>
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
              <div className="space-y-2 text-sm text-blue-800 text-left">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>AI analysis will automatically detect scenes and generate transcripts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Timeline editor will be available once processing completes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Smart editing suggestions will appear in the AI assistant panel</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setUploadedProject(null)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Another Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}