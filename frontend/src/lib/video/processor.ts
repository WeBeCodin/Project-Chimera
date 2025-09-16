/**
 * Video Processor - Browser-based video processing with FFmpeg WASM
 * Handles thumbnail generation, audio extraction, and basic video operations
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoMetadata } from './types';

export class VideoProcessor {
  private ffmpeg: FFmpeg | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initializeFFmpeg();
    await this.initPromise;
  }

  private async _initializeFFmpeg(): Promise<void> {
    try {
      this.ffmpeg = new FFmpeg();
      
      // Use the mt (multithreaded) version for better performance
      const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      });

      this.initialized = true;
      console.log('FFmpeg initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      this.initialized = false;
      this.initPromise = null;
      throw new Error('Failed to initialize video processor');
    }
  }

  async generateThumbnail(videoBlob: Blob, timestamp: number = 0): Promise<Blob> {
    await this.initialize();

    try {
      // Write video file to FFmpeg filesystem
      await this.ffmpeg!.writeFile('input.mp4', await fetchFile(videoBlob));

      // Extract frame at specific timestamp
      await this.ffmpeg!.exec([
        '-i', 'input.mp4',
        '-ss', timestamp.toString(),
        '-frames:v', '1',
        '-vf', 'scale=320:180', // Generate consistent thumbnail size
        '-f', 'image2',
        'thumbnail.jpg'
      ]);

      // Read the generated thumbnail
      const data = await this.ffmpeg!.readFile('thumbnail.jpg');
      
      // Cleanup input file
      await this.ffmpeg!.deleteFile('input.mp4');
      await this.ffmpeg!.deleteFile('thumbnail.jpg');

      return new Blob([data as Uint8Array], { type: 'image/jpeg' });
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      throw new Error('Failed to generate video thumbnail');
    }
  }

  async generateThumbnailStrip(
    videoBlob: Blob, 
    count: number = 10
  ): Promise<{ timestamp: number; blob: Blob }[]> {
    await this.initialize();

    try {
      // First get video duration
      const metadata = await this.extractMetadata(videoBlob);
      const thumbnails: { timestamp: number; blob: Blob }[] = [];
      const interval = metadata.duration / (count + 1); // +1 to avoid thumbnail at very end

      await this.ffmpeg!.writeFile('input.mp4', await fetchFile(videoBlob));

      for (let i = 0; i < count; i++) {
        const timestamp = (i + 1) * interval; // Start from first interval, not 0
        const outputName = `thumbnail_${i}.jpg`;

        await this.ffmpeg!.exec([
          '-i', 'input.mp4',
          '-ss', timestamp.toString(),
          '-frames:v', '1',
          '-vf', 'scale=160:90', // Timeline thumbnail size
          '-f', 'image2',
          outputName
        ]);

        const data = await this.ffmpeg!.readFile(outputName);
        thumbnails.push({
          timestamp,
          blob: new Blob([data as Uint8Array], { type: 'image/jpeg' })
        });
        
        // Cleanup thumbnail file
        await this.ffmpeg!.deleteFile(outputName);
      }

      // Cleanup input file
      await this.ffmpeg!.deleteFile('input.mp4');

      return thumbnails;
    } catch (error) {
      console.error('Failed to generate thumbnail strip:', error);
      throw new Error('Failed to generate thumbnail strip');
    }
  }

  async extractAudioTrack(videoBlob: Blob): Promise<Blob> {
    await this.initialize();

    try {
      await this.ffmpeg!.writeFile('input.mp4', await fetchFile(videoBlob));

      // Extract audio as MP3
      await this.ffmpeg!.exec([
        '-i', 'input.mp4',
        '-vn', // No video
        '-acodec', 'libmp3lame',
        '-ab', '128k', // 128 kbps audio quality
        'audio.mp3'
      ]);

      const data = await this.ffmpeg!.readFile('audio.mp3');
      
      // Cleanup files
      await this.ffmpeg!.deleteFile('input.mp4');
      await this.ffmpeg!.deleteFile('audio.mp3');

      return new Blob([data as Uint8Array], { type: 'audio/mp3' });
    } catch (error) {
      console.error('Failed to extract audio:', error);
      throw new Error('Failed to extract audio track');
    }
  }

  async extractMetadata(videoBlob: Blob): Promise<VideoMetadata> {
    await this.initialize();

    try {
      await this.ffmpeg!.writeFile('input.mp4', await fetchFile(videoBlob));

      // Use ffprobe to extract metadata
      await this.ffmpeg!.exec([
        '-i', 'input.mp4',
        '-show_format',
        '-show_streams',
        '-v', 'quiet',
        '-print_format', 'json',
        'metadata.json'
      ]);

      const metadataBuffer = await this.ffmpeg!.readFile('metadata.json');
      const metadataText = new TextDecoder().decode(metadataBuffer as Uint8Array);
      const metadata = JSON.parse(metadataText);

      // Cleanup files
      await this.ffmpeg!.deleteFile('input.mp4');
      await this.ffmpeg!.deleteFile('metadata.json');

      // Extract relevant information
      const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
      const audioStreams = metadata.streams.filter((s: any) => s.codec_type === 'audio');

      return {
        duration: parseFloat(metadata.format.duration) || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        frameRate: this.parseFrameRate(videoStream?.avg_frame_rate || '0/1'),
        bitRate: parseInt(metadata.format.bit_rate) || 0,
        codec: videoStream?.codec_name || 'unknown',
        audioStreams: audioStreams.length,
        hasVideo: !!videoStream,
        hasAudio: audioStreams.length > 0
      };
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      throw new Error('Failed to extract video metadata');
    }
  }

  async generateEditingProxy(videoBlob: Blob): Promise<Blob> {
    await this.initialize();

    try {
      await this.ffmpeg!.writeFile('input.mp4', await fetchFile(videoBlob));

      // Create a lightweight proxy for smooth editing
      await this.ffmpeg!.exec([
        '-i', 'input.mp4',
        '-vf', 'scale=854:480', // 480p resolution
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '28', // Higher compression for proxy
        '-c:a', 'aac',
        '-b:a', '96k',
        'proxy.mp4'
      ]);

      const data = await this.ffmpeg!.readFile('proxy.mp4');

      // Cleanup files
      await this.ffmpeg!.deleteFile('input.mp4');
      await this.ffmpeg!.deleteFile('proxy.mp4');

      return new Blob([data as Uint8Array], { type: 'video/mp4' });
    } catch (error) {
      console.error('Failed to generate proxy:', error);
      throw new Error('Failed to generate editing proxy');
    }
  }

  async validateVideoFile(file: File): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check file size (5GB limit)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      errors.push('File size exceeds 5GB limit');
    }

    // Check MIME type
    const supportedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/avi',
      'video/x-msvideo',
      'video/mkv',
      'video/x-matroska'
    ];

    if (!supportedTypes.includes(file.type)) {
      errors.push(`Unsupported file type: ${file.type}`);
    }

    // Try to extract metadata to validate it's actually a video
    try {
      const metadata = await this.extractMetadata(file);
      if (!metadata.hasVideo) {
        errors.push('File does not contain video stream');
      }
      if (metadata.duration === 0) {
        errors.push('Invalid video duration');
      }
    } catch (error) {
      errors.push('Unable to process video file - may be corrupted');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private parseFrameRate(frameRateString: string): number {
    const [num, den] = frameRateString.split('/').map(Number);
    return den === 0 ? 0 : num / den;
  }

  async cleanup(): Promise<void> {
    if (this.ffmpeg) {
      // FFmpeg WASM doesn't have an explicit cleanup method
      // Memory will be garbage collected
      this.ffmpeg = null;
      this.initialized = false;
      this.initPromise = null;
    }
  }
}

// Export a singleton instance
export const videoProcessor = new VideoProcessor();