import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient, JobStatus } from '../../../types/prisma'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { status, result, error } = req.body
      
      // Validate status
      const validStatuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        })
      }

      const updateData: any = {}
      
      if (status) updateData.status = status
      if (result) updateData.result = result
      if (error) updateData.error = error
      
      // Set timestamps based on status
      if (status === 'RUNNING' && !updateData.startedAt) {
        updateData.startedAt = new Date()
      }
      if (status === 'COMPLETED' || status === 'FAILED') {
        updateData.completedAt = new Date()
      }
      
      // Update the job
      const job = await prisma.job.update({
        where: { id: id as string },
        data: updateData,
        include: {
          project: {
            select: { id: true, name: true }
          },
          video: {
            select: { id: true, filename: true }
          }
        }
      })
      
      res.status(200).json(job)
    } catch (error) {
      console.error('Error updating job:', error)
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        res.status(404).json({ error: 'Job not found' })
      } else {
        res.status(500).json({ error: 'Failed to update job' })
      }
    }
  } else {
    res.setHeader('Allow', ['PUT', 'PATCH'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}