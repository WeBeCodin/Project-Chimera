import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../types/prisma'
import AWS from 'aws-sdk'

const prisma = new PrismaClient()

// Configure AWS SDK
const stepfunctions = new AWS.StepFunctions({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { s3Key, bucket, projectId, filename, contentType, size } = req.body
      
      // Validate required fields
      if (!s3Key || !bucket || !projectId || !filename) {
        return res.status(400).json({ 
          error: 'Missing required fields: s3Key, bucket, projectId, filename' 
        })
      }
      
      // Create the video record with S3 information
      const originalUrl = `https://${bucket}.s3.amazonaws.com/${s3Key}`
      
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
              s3Key,
              bucket,
              contentType,
              size,
              uploadedAt: new Date().toISOString(),
            },
          },
        })
        jobs.push(job)
      }

      // Trigger Step Functions workflow for all analysis tasks
      try {
        const stateMachineArn = process.env.STEP_FUNCTIONS_ARN
        
        if (stateMachineArn) {
          const stepFunctionInput = {
            videoId: video.id,
            projectId,
            s3Key,
            bucket,
            filename,
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
          console.warn('STEP_FUNCTIONS_ARN not configured, skipping Step Functions trigger')
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