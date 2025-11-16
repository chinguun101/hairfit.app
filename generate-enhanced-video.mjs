/**
 * Test script for ENHANCED video generation with dramatic effects
 * Run with: node generate-enhanced-video.mjs
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateEnhancedVideo() {
  console.log('🎬 Starting ENHANCED video generation with dramatic effects...\n');

  const examplesDir = path.join(__dirname, 'lib', 'examples');
  
  const imageFiles = [
    'original.jpg',
    'hairstyle-1 (7).png',
    'hairstyle-3 (10).png',
    'hairstyle-12 (5).png',
    'hairstyle-13 (2).png',
    'hairstyle-14 (6).png',
    'hairstyle-15 (6).png',
    'hairstyle-16 (5).png',
    'hairstyle-19.png',
    'hairstyle-22 (5).png',
    'hairstyle-1 (7) copy.png',
  ];

  console.log('📸 Checking images...');
  const imagePaths = [];
  
  for (const file of imageFiles) {
    const imagePath = path.join(examplesDir, file);
    try {
      await fs.access(imagePath);
      console.log(`  ✓ ${file}`);
      imagePaths.push(imagePath);
    } catch (error) {
      console.error(`  ✗ ${file} - File not found!`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Found ${imagePaths.length} images\n`);

  // Output path
  const outputDir = path.join(__dirname, 'output');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'hairfit-enhanced.mp4');

  console.log('🎥 Generating ENHANCED video with:');
  console.log('   ✨ Smooth fade in/out transitions (0.5s)');
  console.log('   📝 Text overlays ("Original", "Hairfit #1", etc.)');
  console.log('   🎨 Styled text with semi-transparent black box');
  console.log('   📐 Format: 1080x1920 (TikTok vertical)');
  console.log('   ⏱️  Duration: 2 seconds per image');
  console.log('   🎬 Quality: high (CRF 18)');
  console.log(`   📁 Output: ${outputPath}\n`);

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    const duration = 2; // 2 seconds per image
    const transitionDuration = 0.5; // 0.5 second fade

    // Add each image as input
    imagePaths.forEach((file) => {
      command = command.input(file).inputOptions([
        `-loop 1`,
        `-t ${duration}`
      ]);
    });

    // Build filter complex with text overlays and fade effects
    const scaleFilters = imagePaths.map((_, i) => {
      return `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,` +
        `pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,` +
        `drawtext=text='${i === 0 ? 'Original' : 'Hairfit \\#' + i}':` +
        `fontcolor=white:fontsize=72:box=1:boxcolor=black@0.6:boxborderw=15:` +
        `x=(w-text_w)/2:y=h-th-60,` +
        `fade=t=in:st=0:d=0.5,` +
        `fade=t=out:st=${duration - 0.5}:d=0.5[v${i}]`;
    }).join(';');

    const concatInputs = imagePaths.map((_, i) => `[v${i}]`).join('');
    const filterComplex = `${scaleFilters};${concatInputs}concat=n=${imagePaths.length}:v=1:a=0[outv]`;
    
    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[outv]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('▶️  FFmpeg started with enhanced effects\n');
      })
      .on('progress', (progress) => {
        if (progress.percent && progress.percent > 0) {
          const percent = Math.min(100, Math.max(0, Math.round(progress.percent)));
          const filled = Math.max(0, Math.floor(percent / 2));
          const empty = Math.max(0, 50 - filled);
          const bar = '█'.repeat(filled) + '░'.repeat(empty);
          process.stdout.write(`\r   Progress: [${bar}] ${percent}%`);
        }
      })
      .on('end', async () => {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('\n\n✨ ENHANCED video generated successfully!');
        
        const stats = await fs.stat(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`   📁 Location: ${outputPath}`);
        console.log(`   📊 Size: ${fileSizeMB} MB`);
        console.log(`   ⏱️  Time: ${duration} seconds`);
        console.log(`   🎬 Duration: ~${imagePaths.length * 2} seconds (with transitions)`);
        console.log('\n🎉 Dramatic effects included:');
        console.log('   ✅ Smooth fade in/out transitions (0.5s)');
        console.log('   ✅ Large text overlays ("Original", "Hairfit #1-10")');
        console.log('   ✅ Text with semi-transparent black box');
        console.log('   ✅ Centered at bottom for maximum visibility');
        console.log('   ✅ Professional quality (H.264, 30 FPS)');
        console.log('   ✅ TikTok-ready vertical format (9:16)\n');
        
        resolve();
      })
      .on('error', (err) => {
        console.error('\n\n❌ FFmpeg error:', err.message);
        reject(err);
      })
      .run();
  });
}

generateEnhancedVideo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

