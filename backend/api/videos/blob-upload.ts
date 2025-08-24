import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

// Configure the API route to handle file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Set desired value here
    },
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'PUT') {
    try {
      const { blobKey, projectId, filename, contentType } = req.query

      // Validate required fields from query params
      if (!blobKey || !projectId || !filename) {
        return res.status(400).json({ 
          error: 'Missing required query parameters: blobKey, projectId, filename' 
        })
      }

      // Validate Vercel Blob token
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({
          error: 'Vercel Blob token not configured'
        })
      }

      // Get the file data from the request body
      const chunks: Buffer[] = []
      
      return new Promise((resolve) => {
        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })

        req.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks)

            // Upload to Vercel Blob
            const blob = await put(blobKey as string, buffer, {
              access: 'public',
              contentType: (contentType as string) || 'application/octet-stream',
              token: process.env.BLOB_READ_WRITE_TOKEN,
            })

            res.status(200).json({
              url: blob.url,
              blobKey,
              size: buffer.length,
              contentType: contentType || 'application/octet-stream',
            })
            resolve(undefined)
          } catch (error) {
            console.error('Error uploading to Vercel Blob:', error)
            res.status(500).json({ 
              error: 'Failed to upload to blob storage',
              details: error instanceof Error ? error.message : 'Unknown error'
            })
            resolve(undefined)
          }
        })

        req.on('error', (error) => {
          console.error('Error receiving file data:', error)
          res.status(500).json({ 
            error: 'Failed to receive file data',
            details: error.message
          })
          resolve(undefined)
        })
      })
    } catch (error) {
      console.error('Error in blob upload handler:', error)
      res.status(500).json({ 
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.setHeader('Allow', ['PUT'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}