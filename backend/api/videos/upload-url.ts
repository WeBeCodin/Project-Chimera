import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { filename, contentType, projectId } = req.body
      
      // Validate required fields
      if (!filename || !contentType || !projectId) {
        return res.status(400).json({ 
          error: 'Missing required fields: filename, contentType, projectId' 
        })
      }

      // Check if Vercel Blob token is configured
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ 
          error: 'Vercel Blob not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.' 
        })
      }
      
      // Generate a unique key for the blob
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 15)
      const blobPath = `uploads/${projectId}/${timestamp}-${randomSuffix}-${filename}`
      
      // Return upload information for direct client upload to Vercel Blob
      res.status(200).json({
        uploadUrl: `/api/videos/upload-direct`, // Client will POST to this endpoint with the file
        blobPath,
        metadata: {
          projectId,
          filename,
          contentType,
          uploadPath: blobPath,
        },
      })
    } catch (error) {
      console.error('Error generating upload information:', error)
      res.status(500).json({ 
        error: 'Failed to generate upload information',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}