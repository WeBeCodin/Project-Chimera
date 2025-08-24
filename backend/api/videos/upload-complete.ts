import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../types/prisma'

const prisma = new PrismaClient()

// Configure AWS SDK only if credentials are available
let stepfunctions: any = null
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const AWS = require('aws-sdk')
  stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      // Support both new Vercel Blob format and legacy S3 format
      const { 
        blobUrl, 
        blobPath, 
        projectId, 
        filename, 
        contentType, 
        size,
        // Legacy S3 fields for backward compatibility
        s3Key,
        bucket 
      } = req.body
      
      // Validate required fields (support both formats)
      if (!projectId || !filename) {
        return res.status(400).json({ 
          error: 'Missing required fields: projectId, filename' 
        })
      }

      if (!blobUrl && !s3Key) {
        return res.status(400).json({ 
          error: 'Missing file location: either blobUrl or s3Key is required' 
        })
      }
      
      // Determine the original URL based on available data
      let originalUrl: string
      if (blobUrl) {
        // Using Vercel Blob
        originalUrl = blobUrl
      } else if (s3Key && bucket) {
        // Legacy S3 format
        originalUrl = `https://${bucket}.s3.amazonaws.com/${s3Key}`
      } else {
        return res.status(400).json({ 
          error: 'Invalid file location data provided' 
        })
      }
      
      // Create the video record with file information
      const video = await prisma.video.create({
        data: {
          filename,
          originalUrl,
          projectId,
          // Store additional metadata in a structured way if needed
        },
      })
      
      // Create jobs for all analysis types
      const jobTypes = ['transcription', 'detection', 'summarization']
      const jobs = []
      
      for (const jobType of jobTypes) {
        const job = await prisma.job.create({
          data: {
            type: jobType,
            projectId,
            videoId: video.id,
            status: 'PENDING',
            metadata: {
              videoFilename: filename,
              originalUrl,
              // Include both formats for compatibility
              ...(blobUrl && { blobUrl, blobPath }),
              ...(s3Key && { s3Key, bucket }),
              contentType,
              size,
              uploadedAt: new Date().toISOString(),
            },
          },
        })
        jobs.push(job)
      }

      // Trigger Step Functions workflow for all analysis tasks (only if configured)
      try {
        const stateMachineArn = process.env.STEP_FUNCTIONS_ARN
        
        if (stateMachineArn && stepfunctions) {
          const stepFunctionInput = {
            videoId: video.id,
            projectId,
            originalUrl,
            filename,
            // Include both formats for legacy compatibility
            ...(blobUrl && { blobUrl, blobPath }),
            ...(s3Key && { s3Key, bucket }),
            jobs: jobs.map(job => ({ jobId: job.id, type: job.type })),
            videoDuration: size ? Math.floor(size / 1000000) * 10 : 120, // Rough estimate
          }

          const stepFunctionParams = {
            stateMachineArn,
            input: JSON.stringify(stepFunctionInput),
            name: `video-analysis-${video.id}-${Date.now()}`,
          }

          const result = await stepfunctions.startExecution(stepFunctionParams).promise()
          console.log('Step Functions execution started:', result.executionArn)
          
          // Update jobs with execution ARN for tracking
          await Promise.all(jobs.map(job => 
            prisma.job.update({
              where: { id: job.id },
              data: {
                metadata: {
                  ...job.metadata,
                  executionArn: result.executionArn,
                },
                status: 'RUNNING',
                startedAt: new Date(),
              },
            })
          ))
        } else {
          console.log('Step Functions not configured or AWS SDK not available - jobs will remain in PENDING status')
        }
      } catch (stepFunctionError) {
        console.error('Error triggering Step Functions:', stepFunctionError)
        // Don't fail the entire request if Step Functions fails
      }
      
      res.status(201).json({ 
        video, 
        jobs,
        transcriptionJob: jobs.find(j => j.type === 'transcription'), // For backward compatibility
        message: 'Video registered successfully and analysis jobs created'
      })
    } catch (error) {
      console.error('Error registering video upload:', error)
      res.status(500).json({ 
        error: 'Failed to register video upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}