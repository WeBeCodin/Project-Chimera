import { type VercelRequest, type VercelResponse } from '@vercel/node'
import { PrismaClient } from '../../types/prisma'

const prisma = new PrismaClient()

// Optional AWS Step Functions integration (can be disabled for free tier)
let stepfunctions: any = null
try {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const AWS = require('aws-sdk')
    stepfunctions = new AWS.StepFunctions({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    })
  }
} catch (error) {
  console.warn('AWS SDK not available, Step Functions integration disabled')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { blobUrl, blobKey, projectId, filename, contentType, size } = req.body
      
      // Validate required fields
      if (!blobUrl || !projectId || !filename) {
        return res.status(400).json({ 
          error: 'Missing required fields: blobUrl, projectId, filename' 
        })
      }
      
      // Create the video record with blob information
      const video = await prisma.video.create({
        data: {
          filename,
          originalUrl: blobUrl,
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
              originalUrl: blobUrl,
              blobKey,
              contentType,
              size,
              uploadedAt: new Date().toISOString(),
            },
          },
        })
        jobs.push(job)
      }

      // Trigger Step Functions workflow for all analysis tasks (if configured)
      if (stepfunctions) {
        try {
          const stateMachineArn = process.env.STEP_FUNCTIONS_ARN
          
          if (stateMachineArn) {
            const stepFunctionInput = {
              videoId: video.id,
              projectId,
              blobUrl,
              blobKey,
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
      } else {
        console.log('AWS Step Functions not configured, jobs will remain in PENDING state')
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