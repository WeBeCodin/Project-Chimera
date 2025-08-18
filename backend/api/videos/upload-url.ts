import { type VercelRequest, type VercelResponse } from '@vercel/node'
import AWS from 'aws-sdk'

// Configure AWS SDK
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

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
      
      // Generate a unique key for the S3 object
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 15)
      const s3Key = `uploads/${projectId}/${timestamp}-${randomSuffix}-${filename}`
      
      // Parameters for the pre-signed URL
      const params = {
        Bucket: process.env.S3_BUCKET_NAME || `chimera-videos-${process.env.AWS_ACCOUNT_ID}`,
        Key: s3Key,
        Expires: 60 * 15, // 15 minutes
        ContentType: contentType,
        Metadata: {
          projectId,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
      }
      
      // Generate pre-signed URL for PUT request
      const uploadUrl = await s3.getSignedUrlPromise('putObject', params)
      
      // Also generate a pre-signed URL for GET request (for accessing the file later)
      const viewUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: params.Bucket,
        Key: s3Key,
        Expires: 60 * 60 * 24, // 24 hours
      })
      
      res.status(200).json({
        uploadUrl,
        viewUrl,
        s3Key,
        bucket: params.Bucket,
        expiresIn: params.Expires,
        metadata: {
          projectId,
          filename,
          contentType,
        },
      })
    } catch (error) {
      console.error('Error generating pre-signed URL:', error)
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