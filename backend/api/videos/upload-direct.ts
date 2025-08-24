import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      // For form uploads, the file will be in req.body or as multipart form data
      // This is a simplified version - in production you'd want proper multipart parsing
      const { file, blobPath, projectId, filename, contentType } = req.body
      
      // Validate required fields
      if (!file || !blobPath || !projectId || !filename) {
        return res.status(400).json({ 
          error: 'Missing required fields: file, blobPath, projectId, filename' 
        })
      }

      // Check if Vercel Blob token is configured
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ 
          error: 'Vercel Blob not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.' 
        })
      }

      // Convert file data to buffer if it's base64
      let fileBuffer: Buffer
      if (typeof file === 'string') {
        // Assume base64 encoded
        fileBuffer = Buffer.from(file, 'base64')
      } else {
        fileBuffer = Buffer.from(file)
      }

      // Upload to Vercel Blob
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        contentType: contentType || 'application/octet-stream',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      res.status(200).json({
        success: true,
        blobUrl: blob.url,
        blobPath,
        size: fileBuffer.length,
        metadata: {
          projectId,
          filename,
          contentType,
          uploadedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error)
      res.status(500).json({ 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}