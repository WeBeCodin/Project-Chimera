import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../../types/prisma'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  
  if (req.method === 'GET') {
    try {
      // First get the video
      const video = await prisma.video.findUnique({
        where: { id: id as string },
        include: {
          project: {
            select: { id: true, name: true }
          }
        }
      })
      
      if (!video) {
        return res.status(404).json({ error: 'Video not found' })
      }
      
      // Get all jobs for this video
      const jobs = await prisma.job.findMany({
        where: { videoId: id as string },
        orderBy: { createdAt: 'desc' }
      })
      
      // Group results by job type
      const analysisResults = {
        video,
        transcription: null,
        detection: null,
        summarization: null,
        jobs: jobs
      }
      
      jobs.forEach((job: any) => {
        if (job.status === 'COMPLETED' && job.result) {
          if (job.type === 'transcription') {
            analysisResults.transcription = {
              job,
              ...job.result
            }
          } else if (job.type === 'detection') {
            analysisResults.detection = {
              job,
              ...job.result
            }
          } else if (job.type === 'summarization') {
            analysisResults.summarization = {
              job,
              ...job.result
            }
          }
        }
      })
      
      res.status(200).json(analysisResults)
    } catch (error) {
      console.error('Error fetching video analysis results:', error)
      res.status(500).json({ error: 'Failed to fetch video analysis results' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}