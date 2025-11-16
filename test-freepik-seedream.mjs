#!/usr/bin/env node

/**
 * Freepik Seedream Model Test Script
 * Tests hairstyle generation using Freepik's Seedream API with example images
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
const SEEDREAM_ENDPOINT = `${FREEPIK_API_BASE}/text-to-image/seedream`;
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
 * Submit task to Seedream API
 */
async function submitTask(prompt, options = {}) {
  console.log('\n📤 Submitting task to Freepik Seedream endpoint...');
  console.log('Prompt:', prompt.substring(0, 100) + '...');
  
  const requestBody = {
    prompt,
    ...options
  };
  
  console.log('Request params:', JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(SEEDREAM_ENDPOINT, {
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
  const response = await fetch(`${SEEDREAM_ENDPOINT}/${taskId}`, {
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
  console.log('🧪 Freepik Seedream Model Test');
  console.log('==============================\n');
  
  const startTime = Date.now();
  
  try {
    // Define test hairstyle transformation
    const hairstyleName = 'Long Red Hair';
    const hairstyleDescription = 'Long flowing hair with vibrant red color, shoulder-length or longer, with natural waves and volume, rich auburn/crimson red tones, glossy and healthy-looking texture';
    
    const prompt = `Professional portrait photography of a person with ${hairstyleName}. ${hairstyleDescription}. Photorealistic, studio lighting, professional quality, high detail.`;

    console.log('🎨 Test Hairstyle:', hairstyleName);
    console.log('Description:', hairstyleDescription);
    console.log('\nNote: Seedream is text-only (no reference image support in basic mode)');
    
    // Submit task
    const taskId = await submitTask(prompt);
    
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
    
    const outputPath = join(outputDir, 'seedream-result.png');
    writeFileSync(outputPath, imageBuffer);
    console.log('✅ Image saved to:', outputPath);
    
    // Report metrics
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 Test Metrics:');
    console.log('  - Total duration:', totalDuration, 'seconds');
    console.log('  - Hairstyle:', hairstyleName);
    console.log('  - Status: SUCCESS');
    
    console.log('\n✨ Test completed successfully!');
    console.log('View the result at:', outputPath);
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n\n❌ Test failed after', duration, 'seconds');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();

