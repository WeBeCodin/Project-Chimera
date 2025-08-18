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
            select: { id: true, filename: true }
          }
        }
      })
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' })
      }
      
      res.status(200).json(job)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch job status' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}