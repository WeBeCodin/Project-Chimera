import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../types/prisma'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { s3Key, bucket, projectId, filename, contentType, size } = req.body
      
      // Validate required fields
      if (!s3Key || !bucket || !projectId || !filename) {
        return res.status(400).json({ 
          error: 'Missing required fields: s3Key, bucket, projectId, filename' 
        })
      }
      
      // Create the video record with S3 information
      const originalUrl = `https://${bucket}.s3.amazonaws.com/${s3Key}`
      
      const video = await prisma.video.create({
        data: {
          filename,
          originalUrl,
          projectId,
          // Store additional metadata in a structured way if needed
        },
      })
      
      // Automatically create a transcription job for the uploaded video
      const transcriptionJob = await prisma.job.create({
        data: {
          type: 'transcription',
          projectId,
          videoId: video.id,
          status: 'PENDING',
          metadata: {
            videoFilename: filename,
            originalUrl,
            s3Key,
            bucket,
            contentType,
            size,
            uploadedAt: new Date().toISOString(),
          },
        },
      })
      
      res.status(201).json({ 
        video, 
        transcriptionJob,
        message: 'Video registered successfully and transcription job created'
      })
    } catch (error) {
      console.error('Error registering video upload:', error)
      res.status(500).json({ 
        error: 'Failed to register video upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}