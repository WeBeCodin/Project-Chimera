#!/usr/bin/env node

/**
 * Database setup and migration script
 * Run this after setting up your Vercel Postgres database
 */

import { PrismaClient } from '../types/prisma'

async function setupDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Testing database connection...')
    
    // Test basic connection by trying to create a user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })
    console.log('✅ Database connection successful!')
    console.log('Created test user:', testUser)
    
    // Create a test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'A test project for verification',
        userId: testUser.id,
      },
    })
    console.log('✅ Created test project:', testProject)
    
    // Create a test video and job
    const testVideo = await prisma.video.create({
      data: {
        filename: 'test-video.mp4',
        originalUrl: 'https://example.com/test-video.mp4',
        projectId: testProject.id,
      },
    })
    console.log('✅ Created test video:', testVideo)
    
    const testJob = await prisma.job.create({
      data: {
        type: 'transcription',
        projectId: testProject.id,
        videoId: testVideo.id,
        status: 'PENDING',
        metadata: { test: true },
      },
    })
    console.log('✅ Created test job:', testJob)
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('All models (User, Project, Video, Job) are working correctly.')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })