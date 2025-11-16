import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface EnhancedVideoOptions {
  images: string[]; // Array of base64 data URLs
  outputPath?: string;
  fps?: number;
  duration?: number; // Duration per image in seconds
  transitionDuration?: number; // Duration of transition in seconds
  effect?: 'fade' | 'zoom' | 'slide' | 'none';
  textOverlay?: boolean; // Add "Hairfit #1", "Hairfit #2" text
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Converts base64 data URL to a temporary file
 */
async function base64ToTempFile(base64Data: string, index: number, tempDir: string): Promise<string> {
  const base64String = base64Data.includes('base64,') 
    ? base64Data.split('base64,')[1] 
    : base64Data;
  
  const buffer = Buffer.from(base64String, 'base64');
  const tempFilePath = path.join(tempDir, `frame_${String(index).padStart(3, '0')}.png`);
  
  await fs.writeFile(tempFilePath, buffer);
  return tempFilePath;
}

/**
 * Generates an enhanced slideshow video with dramatic effects
 */
export async function generateEnhancedVideo(
  options: EnhancedVideoOptions
): Promise<{ success: boolean; videoPath?: string; error?: string }> {
  const {
    images,
    outputPath,
    fps = 30,
    duration = 2, // 2 seconds per image for more dramatic effect
    transitionDuration = 0.5, // 0.5 second transitions
    effect = 'zoom',
    textOverlay = true,
    width = 1080,
    height = 1920,
    quality = 'high'
  } = options;

  if (!images || images.length === 0) {
    return { success: false, error: 'No images provided' };
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hairfit-enhanced-'));
  const tempFiles: string[] = [];

  try {
    console.log('Converting images to temporary files...');
    for (let i = 0; i < images.length; i++) {
      const tempFile = await base64ToTempFile(images[i], i, tempDir);
      tempFiles.push(tempFile);
    }

    const finalOutputPath = outputPath || path.join(tempDir, 'output.mp4');

    console.log('Generating enhanced video with effects...');
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg();

      // Add each image as input with duration
      tempFiles.forEach((file) => {
        command = command.input(file).inputOptions([
          `-loop 1`,
          `-t ${duration}`
        ]);
      });

      let filterComplex = '';

      if (effect === 'zoom') {
        // Ken Burns effect - zoom in slightly on each image
        const scaleFilters = tempFiles.map((_, i) => {
          const zoomStart = 1.0;
          const zoomEnd = 1.1; // 10% zoom
          return `[${i}:v]scale=${width * 1.2}:${height * 1.2}:force_original_aspect_ratio=increase,` +
                 `crop=${width}:${height},` +
                 `setsar=1,fps=${fps},` +
                 `zoompan=z='if(lte(zoom,1.0),${zoomStart},max(${zoomStart},zoom-0.002))':d=${duration * fps}:s=${width}x${height}:fps=${fps}` +
                 (textOverlay ? `,drawtext=text='${i === 0 ? 'Original' : 'Hairfit #' + i}':fontcolor=white:fontsize=60:` +
                 `box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-th-50` : '') +
                 `[v${i}]`;
        }).join(';');

        // Create xfade transitions
        let fadeChain = '';
        for (let i = 0; i < tempFiles.length - 1; i++) {
          if (i === 0) {
            fadeChain = `[v0][v1]xfade=transition=circleopen:duration=${transitionDuration}:offset=${duration - transitionDuration}[f1]`;
          } else {
            fadeChain += `;[f${i}][v${i + 1}]xfade=transition=circleopen:duration=${transitionDuration}:offset=${(duration * (i + 1)) - (transitionDuration * (i + 1))}[f${i + 1}]`;
          }
        }

        filterComplex = `${scaleFilters};${fadeChain}`;

        command
          .complexFilter(filterComplex, `f${tempFiles.length - 1}`)
          .outputOptions([
            '-map', `[f${tempFiles.length - 1}]`,
            '-c:v', 'libx264',
            '-preset', quality === 'high' ? 'medium' : quality === 'medium' ? 'fast' : 'veryfast',
            '-crf', quality === 'high' ? '18' : quality === 'medium' ? '23' : '28',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart'
          ]);

      } else if (effect === 'fade') {
        // Simple fade with text overlay
        const scaleFilters = tempFiles.map((_, i) => 
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}` +
          (textOverlay ? `,drawtext=text='${i === 0 ? 'Original' : 'Hairfit #' + i}':fontcolor=white:fontsize=60:` +
          `box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-th-50` : '') +
          `[v${i}]`
        ).join(';');

        // Create smooth fade transitions
        let fadeChain = '';
        for (let i = 0; i < tempFiles.length - 1; i++) {
          if (i === 0) {
            fadeChain = `[v0][v1]xfade=transition=fade:duration=${transitionDuration}:offset=${duration - transitionDuration}[f1]`;
          } else {
            fadeChain += `;[f${i}][v${i + 1}]xfade=transition=fade:duration=${transitionDuration}:offset=${(duration * (i + 1)) - (transitionDuration * (i + 1))}[f${i + 1}]`;
          }
        }

        filterComplex = `${scaleFilters};${fadeChain}`;

        command
          .complexFilter(filterComplex, `f${tempFiles.length - 1}`)
          .outputOptions([
            '-map', `[f${tempFiles.length - 1}]`,
            '-c:v', 'libx264',
            '-preset', quality === 'high' ? 'medium' : 'fast',
            '-crf', quality === 'high' ? '18' : '23',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart'
          ]);

      } else {
        // Simple concat with text overlay
        const scaleFilters = tempFiles.map((_, i) => 
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}` +
          (textOverlay ? `,drawtext=text='${i === 0 ? 'Original' : 'Hairfit #' + i}':fontcolor=white:fontsize=60:` +
          `box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-th-50` : '') +
          `[v${i}]`
        ).join(';');

        const concatInputs = tempFiles.map((_, i) => `[v${i}]`).join('');
        filterComplex = `${scaleFilters};${concatInputs}concat=n=${tempFiles.length}:v=1:a=0[outv]`;

        command
          .complexFilter(filterComplex)
          .outputOptions([
            '-map', '[outv]',
            '-c:v', 'libx264',
            '-preset', quality === 'high' ? 'medium' : 'fast',
            '-crf', quality === 'high' ? '18' : '23',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart'
          ]);
      }

      command
        .output(finalOutputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg started with effects');
        })
        .on('progress', (progress) => {
          if (progress.percent && progress.percent > 0) {
            console.log(`Processing: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('Enhanced video generation completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    // Read the generated video
    const videoBuffer = await fs.readFile(finalOutputPath);
    const base64Video = videoBuffer.toString('base64');

    // Cleanup
    await cleanupTempFiles(tempDir, tempFiles, finalOutputPath);

    return {
      success: true,
      videoPath: `data:video/mp4;base64,${base64Video}`
    };

  } catch (error) {
    console.error('Error generating enhanced video:', error);
    
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

async function cleanupTempFiles(tempDir: string, tempFiles: string[], outputPath?: string) {
  try {
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (err) {
        // Ignore
      }
    }

    if (outputPath) {
      try {
        await fs.unlink(outputPath);
      } catch (err) {
        // Ignore
      }
    }

    try {
      await fs.rmdir(tempDir);
    } catch (err) {
      // Ignore
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

