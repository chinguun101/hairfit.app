#!/usr/bin/env node

/**
 * Freepik Mystic Model Test Script
 * Tests hairstyle generation using Freepik's Mystic API with example images
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const FREEPIK_API_BASE = 'https://api.freepik.com/v1/ai';
const MYSTIC_ENDPOINT = `${FREEPIK_API_BASE}/mystic`;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 60;

// API Key
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

if (!FREEPIK_API_KEY) {
  console.error('❌ Error: FREEPIK_API_KEY environment variable is not set');
  console.error('Please add it to your .env.local file');
  process.exit(1);
}

/**
 * Convert image file to base64
 */
function imageToBase64(imagePath) {
  const imageBuffer = readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Submit task to Mystic API
 */
async function submitTask(prompt, referenceImageBase64, options = {}) {
  console.log('\n📤 Submitting task to Freepik Mystic endpoint...');
  console.log('Prompt:', prompt.substring(0, 100) + '...');
  console.log('Model:', options.model || 'realism');
  console.log('Resolution:', options.resolution || '2k');
  
  const requestBody = {
    prompt,
    structure_reference: referenceImageBase64,
    resolution: options.resolution || '2k',
    model: options.model || 'realism',
    aspect_ratio: options.aspect_ratio || 'portrait_9_16',
    structure_strength: options.structure_strength || 70,
    adherence: options.adherence || 85,
    creative_detailing: options.creative_detailing || 60,
  };
  
  const response = await fetch(MYSTIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-freepik-api-key': FREEPIK_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit task: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Task submitted successfully');
  console.log('Task ID:', data.data.task_id);
  
  return data.data.task_id;
}

/**
 * Check task status
 */
async function checkStatus(taskId) {
  const response = await fetch(`${MYSTIC_ENDPOINT}/${taskId}`, {
    method: 'GET',
    headers: {
      'x-freepik-api-key': FREEPIK_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check status: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return await response.json();
}

/**
 * Poll task until complete
 */
async function pollUntilComplete(taskId) {
  console.log('\n⏳ Polling for task completion...');
  
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    const statusResponse = await checkStatus(taskId);
    const status = statusResponse.data.status;
    
    process.stdout.write(`\rAttempt ${attempt}/${MAX_POLL_ATTEMPTS}: Status = ${status}     `);

    if (status === 'COMPLETED') {
      console.log('\n✅ Task completed successfully!');
      if (!statusResponse.data.generated || statusResponse.data.generated.length === 0) {
        throw new Error('No images were generated');
      }
      return statusResponse.data.generated;
    }

    if (status === 'FAILED') {
      const errorMessage = statusResponse.data.error || 'Unknown error';
      throw new Error(`Task failed: ${errorMessage}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Task polling timed out');
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  console.log('\n📥 Downloading generated image...');
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Main test function
 */
async function runTest() {
  console.log('🧪 Freepik Mystic Model Test');
  console.log('============================\n');
  
  const startTime = Date.now();
  
  try {
    // 1. Load example image
    const exampleImagePath = join(__dirname, 'lib', 'examples', 'original.jpg');
    console.log('📷 Loading example image:', exampleImagePath);
    
    if (!existsSync(exampleImagePath)) {
      throw new Error(`Example image not found: ${exampleImagePath}`);
    }
    
    const imageBase64 = imageToBase64(exampleImagePath);
    console.log('✅ Image loaded successfully (size:', imageBase64.length, 'bytes)');
    
    // 2. Define test hairstyle transformation
    const hairstyleName = 'Long Red Hair';
    const hairstyleDescription = 'Long flowing hair with vibrant red color, shoulder-length or longer, with natural waves and volume, rich auburn/crimson red tones, glossy and healthy-looking texture';
    
    const prompt = `Professional hairstyle transformation. Transform the person's hairstyle to: ${hairstyleName}. ${hairstyleDescription}. Keep face, features, skin tone, clothing, and background exactly the same. Only change the hair. Make it look natural and photorealistic with proper lighting and shadows.`;

    console.log('\n🎨 Test Hairstyle:', hairstyleName);
    console.log('Description:', hairstyleDescription);
    
    // 3. Test different Mystic models
    const models = [
      { model: 'realism', resolution: '2k', name: 'Mystic Realism 2K' },
      { model: 'fluid', resolution: '2k', name: 'Mystic Fluid 2K' },
      { model: 'zen', resolution: '2k', name: 'Mystic Zen 2K' },
    ];
    
    for (const modelConfig of models) {
      console.log('\n' + '='.repeat(50));
      console.log(`Testing: ${modelConfig.name}`);
      console.log('='.repeat(50));
      
      // Submit task
      const taskId = await submitTask(prompt, imageBase64, {
        model: modelConfig.model,
        resolution: modelConfig.resolution,
        aspect_ratio: 'portrait_2_3',
        structure_strength: 70,
        adherence: 85,
        creative_detailing: 60,
      });
      
      // Poll until complete
      const imageUrls = await pollUntilComplete(taskId);
      console.log('\n📸 Generated', imageUrls.length, 'image(s)');
      
      // Download and save the first image
      const imageUrl = imageUrls[0];
      console.log('Image URL:', imageUrl);
      
      const imageBuffer = await downloadImage(imageUrl);
      
      // Create output directory if it doesn't exist
      const outputDir = join(__dirname, 'output');
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = join(outputDir, `mystic-${modelConfig.model}-result.png`);
      writeFileSync(outputPath, imageBuffer);
      console.log('✅ Image saved to:', outputPath);
    }
    
    // 6. Report metrics
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 Test Metrics:');
    console.log('  - Total duration:', totalDuration, 'seconds');
    console.log('  - Models tested:', models.length);
    console.log('  - Hairstyle:', hairstyleName);
    console.log('  - Status: SUCCESS');
    
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n\n❌ Test failed after', duration, 'seconds');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();

