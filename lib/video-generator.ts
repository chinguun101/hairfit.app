import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface VideoGenerationOptions {
  images: string[]; // Array of base64 data URLs or file paths
  outputPath?: string;
  fps?: number;
  duration?: number; // Duration per image in seconds
  transition?: 'fade' | 'slide' | 'none';
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Converts base64 data URL to a temporary file
 */
async function base64ToTempFile(base64Data: string, index: number, tempDir: string): Promise<string> {
  // Remove data URL prefix if present
  const base64String = base64Data.includes('base64,') 
    ? base64Data.split('base64,')[1] 
    : base64Data;
  
  const buffer = Buffer.from(base64String, 'base64');
  const tempFilePath = path.join(tempDir, `frame_${String(index).padStart(3, '0')}.png`);
  
  await fs.writeFile(tempFilePath, buffer);
  return tempFilePath;
}

/**
 * Generates a slideshow video from an array of images
 */
export async function generateSlideshowVideo(
  options: VideoGenerationOptions
): Promise<{ success: boolean; videoPath?: string; error?: string }> {
  const {
    images,
    outputPath,
    fps = 30,
    duration = 1, // 1 second per image
    transition = 'fade',
    width = 1080,
    height = 1920, // TikTok vertical format
    quality = 'high'
  } = options;

  if (!images || images.length === 0) {
    return { success: false, error: 'No images provided' };
  }

  // Create temporary directory for processing
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hairfit-video-'));
  const tempFiles: string[] = [];

  try {
    // Convert all images to temporary files
    console.log('Converting images to temporary files...');
    for (let i = 0; i < images.length; i++) {
      const tempFile = await base64ToTempFile(images[i], i, tempDir);
      tempFiles.push(tempFile);
    }

    // Generate output path if not provided
    const finalOutputPath = outputPath || path.join(tempDir, 'output.mp4');

    // Generate video with ffmpeg
    console.log('Generating video with ffmpeg...');
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg();

      // Add each image as input with duration
      tempFiles.forEach((file) => {
        command = command.input(file).inputOptions([
          `-loop 1`,
          `-t ${duration}`
        ]);
      });

      // Simple concatenation (xfade transitions cause issues with complex filters)
      const scaleAndConcat = tempFiles.map((_, i) => 
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}]`
      ).join(';');
      
      const concatInputs = tempFiles.map((_, i) => `[v${i}]`).join('');
      
      const filterComplex = `${scaleAndConcat};${concatInputs}concat=n=${tempFiles.length}:v=1:a=0[outv]`;
      
      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outv]',
          '-c:v', 'libx264',
          '-preset', quality === 'high' ? 'medium' : quality === 'medium' ? 'medium' : 'fast',
          '-crf', quality === 'high' ? '18' : quality === 'medium' ? '23' : '28',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ])
        .output(finalOutputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Processing: ${Math.round(progress.percent)}% done`);
          }
        })
        .on('end', () => {
          console.log('Video generation completed successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    // Read the generated video file
    const videoBuffer = await fs.readFile(finalOutputPath);
    const base64Video = videoBuffer.toString('base64');

    // Cleanup temporary files
    await cleanupTempFiles(tempDir, tempFiles, finalOutputPath);

    return {
      success: true,
      videoPath: `data:video/mp4;base64,${base64Video}`
    };

  } catch (error) {
    console.error('Error generating video:', error);
    
    // Cleanup on error
    try {
      await cleanupTempFiles(tempDir, tempFiles);
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Cleanup temporary files and directory
 */
async function cleanupTempFiles(tempDir: string, tempFiles: string[], outputPath?: string) {
  try {
    // Delete temp image files
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (err) {
        console.error(`Failed to delete temp file ${file}:`, err);
      }
    }

    // Delete output file if it was in temp dir
    if (outputPath) {
      try {
        await fs.unlink(outputPath);
      } catch (err) {
        console.error(`Failed to delete output file ${outputPath}:`, err);
      }
    }

    // Remove temp directory
    try {
      await fs.rmdir(tempDir);
    } catch (err) {
      console.error(`Failed to remove temp directory ${tempDir}:`, err);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

/**
 * Generate video from local file paths (for testing)
 */
export async function generateVideoFromFiles(
  imagePaths: string[],
  outputPath: string,
  options?: Partial<VideoGenerationOptions>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Read all images and convert to base64
    const images: string[] = [];
    for (const imagePath of imagePaths) {
      const buffer = await fs.readFile(imagePath);
      const base64 = buffer.toString('base64');
      images.push(base64);
    }

    const result = await generateSlideshowVideo({
      images,
      outputPath,
      ...options
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

