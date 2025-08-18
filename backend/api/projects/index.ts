import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../types/prisma'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { name, description, userId } = req.body
      
      // Validate required fields
      if (!name || !userId) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, userId' 
        })
      }
      
      const project = await prisma.project.create({
        data: {
          name,
          description,
          userId,
        },
      })
      
      res.status(201).json(project)
    } catch (error) {
      console.error('Error creating project:', error)
      res.status(500).json({ error: 'Failed to create project' })
    }
  } else if (req.method === 'GET') {
    try {
      const projects = await prisma.project.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          videos: true,
          _count: {
            select: { jobs: true }
          }
        }
      })
      
      res.status(200).json(projects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      res.status(500).json({ error: 'Failed to fetch projects' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}