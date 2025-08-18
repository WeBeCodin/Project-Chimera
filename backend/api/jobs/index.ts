import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient, JobStatus } from '../../types/prisma'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { type, projectId, videoId, metadata } = req.body
      
      const job = await prisma.job.create({
        data: {
          type,
          projectId,
          videoId,
          metadata,
          status: JobStatus.PENDING,
        },
      })
      
      res.status(201).json(job)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create job' })
    }
  } else if (req.method === 'GET') {
    try {
      const { projectId, status } = req.query
      
      const where: any = {}
      if (projectId) where.projectId = projectId
      if (status) where.status = status
      
      const jobs = await prisma.job.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
          video: {
            select: { id: true, filename: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      res.status(200).json(jobs)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch jobs' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}