import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../types/prisma'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { filename, originalUrl, duration, projectId } = req.body
      
      // Validate required fields
      if (!filename || !originalUrl || !projectId) {
        return res.status(400).json({ 
          error: 'Missing required fields: filename, originalUrl, projectId' 
        })
      }
      
      const video = await prisma.video.create({
        data: {
          filename,
          originalUrl,
          duration,
          projectId,
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
          },
        },
      })
      
      res.status(201).json({ 
        video, 
        transcriptionJob,
        message: 'Video uploaded successfully and transcription job created'
      })
    } catch (error) {
      console.error('Error creating video:', error)
      res.status(500).json({ error: 'Failed to create video' })
    }
  } else if (req.method === 'GET') {
    try {
      const { projectId } = req.query
      
      const where = projectId ? { projectId: projectId as string } : {}
      
      const videos = await prisma.video.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
          jobs: {
            select: { 
              id: true, 
              type: true, 
              status: true,
              createdAt: true,
              completedAt: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      res.status(200).json(videos)
    } catch (error) {
      console.error('Error fetching videos:', error)
      res.status(500).json({ error: 'Failed to fetch videos' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}