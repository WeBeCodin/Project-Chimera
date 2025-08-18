import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../../types/prisma'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  
  if (req.method === 'GET') {
    try {
      const job = await prisma.job.findUnique({
        where: { id: id as string },
        include: {
          project: {
            select: { id: true, name: true }
          },
          video: {
            select: { id: true, filename: true, originalUrl: true, duration: true }
          }
        }
      })
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' })
      }
      
      // If job is completed and has results, return them
      if (job.status === 'COMPLETED' && job.result) {
        res.status(200).json({
          job,
          results: job.result,
          type: job.type,
        })
      } else {
        res.status(200).json({
          job,
          results: null,
          type: job.type,
          message: job.status === 'RUNNING' 
            ? 'Analysis is still in progress' 
            : job.status === 'FAILED' 
            ? 'Analysis failed' 
            : 'Analysis has not started yet'
        })
      }
    } catch (error) {
      console.error('Error fetching job results:', error)
      res.status(500).json({ error: 'Failed to fetch job results' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}