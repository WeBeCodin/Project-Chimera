/**
 * Video Processing Pipeline
 * Orchestrates transcription, analysis, and summarization
 */

export * from './transcribe';
export * from './analyze';

import { transcribeVideo, type TranscriptionResult } from './transcribe';
import { analyzeVideo, summarizeVideo, type DetectionResult, type SummarizationResult } from './analyze';

export interface ProcessingResult {
  transcription: TranscriptionResult;
  detection: DetectionResult;
  summarization: SummarizationResult;
}

/**
 * Process video through complete pipeline
 */
export async function processVideo(videoUrl: string): Promise<ProcessingResult> {
  console.log(`Starting video processing for: ${videoUrl}`);
  
  // Step 1: Transcribe
  console.log('Step 1/3: Transcribing video...');
  const transcription = await transcribeVideo(videoUrl);
  
  // Step 2: Analyze/Detect
  console.log('Step 2/3: Analyzing video content...');
  const detection = await analyzeVideo(videoUrl, transcription.text);
  
  // Step 3: Summarize
  console.log('Step 3/3: Generating summary...');
  const summarization = await summarizeVideo(videoUrl, transcription.text, detection);
  
  console.log('Video processing complete!');
  
  return {
    transcription,
    detection,
    summarization
  };
}
