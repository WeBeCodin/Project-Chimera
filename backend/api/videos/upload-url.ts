import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      // Handle multipart form upload directly
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // This would require a form parser, but for now we'll handle file uploads differently
        return res.status(400).json({
          error: 'Direct file upload not supported in this endpoint. Use blob-upload instead.'
        })
      }

      const { filename, contentType, projectId } = req.body
      
      // Validate required fields
      if (!filename || !contentType || !projectId) {
        return res.status(400).json({ 
          error: 'Missing required fields: filename, contentType, projectId' 
        })
      }

      // Validate Vercel Blob token
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({
          error: 'Vercel Blob token not configured'
        })
      }
      
      // Generate a unique key for the blob object
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 15)
      const blobKey = `uploads/${projectId}/${timestamp}-${randomSuffix}-${filename}`
      
      // For Vercel Blob, we return the upload information
      // The client will need to upload using the separate blob-upload endpoint
      res.status(200).json({
        blobKey,
        uploadEndpoint: '/api/videos/blob-upload',
        expiresIn: 60 * 15, // 15 minutes (for compatibility)
        metadata: {
          projectId,
          filename,
          contentType,
        },
      })
    } catch (error) {
      console.error('Error generating blob upload info:', error)
      res.status(500).json({ 
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}