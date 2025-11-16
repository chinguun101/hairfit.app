#!/usr/bin/env node

/**
 * Freepik Gemini 2.5 Flash Sandbox Test Script
 * Tests hairstyle generation using Freepik's API with example images
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
const GEMINI_ENDPOINT = `${FREEPIK_API_BASE}/gemini-2-5-flash-image-preview`;
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
 * Submit task to Freepik API
 */
async function submitTask(prompt, referenceImageBase64) {
  console.log('\n📤 Submitting task to Freepik Gemini endpoint...');
  console.log('Prompt:', prompt.substring(0, 100) + '...');
  
  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-freepik-api-key': FREEPIK_API_KEY,
    },
    body: JSON.stringify({
      prompt,
      reference_images: [referenceImageBase64]
    }),
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
  const response = await fetch(`${GEMINI_ENDPOINT}/${taskId}`, {
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
  console.log('🧪 Freepik Gemini 2.5 Flash Sandbox Test');
  console.log('==========================================\n');
  
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
    
    const prompt = `You are an expert hair stylist and photo editor AI. Your task is to transform the hairstyle in the provided photo to match the requested style EXACTLY.

Target Hairstyle: "${hairstyleName}"
Style Details: ${hairstyleDescription}

Transformation Guidelines:
- Transform ONLY the hair - change the cut, length, color, style, and texture to perfectly match the target hairstyle
- The person's face, facial features, skin tone, body, clothing, and background MUST remain completely unchanged
- The new hairstyle must look natural and realistic on this person
- Ensure the hair color, cut, length, and styling match the description precisely
- The hair should blend naturally with the person's head and face
- Maintain proper lighting, shadows, and hair texture to look photorealistic

Output: Return ONLY the final transformed image with the new hairstyle. Do not return text.`;

    console.log('\n🎨 Test Hairstyle:', hairstyleName);
    console.log('Description:', hairstyleDescription);
    
    // 3. Submit task
    const taskId = await submitTask(prompt, imageBase64);
    
    // 4. Poll until complete
    const imageUrls = await pollUntilComplete(taskId);
    console.log('\n📸 Generated', imageUrls.length, 'image(s)');
    
    // 5. Download and save the first image
    const imageUrl = imageUrls[0];
    console.log('Image URL:', imageUrl);
    
    const imageBuffer = await downloadImage(imageUrl);
    
    // Create output directory if it doesn't exist
    const outputDir = join(__dirname, 'output');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = join(outputDir, 'freepik-test-result.png');
    writeFileSync(outputPath, imageBuffer);
    console.log('✅ Image saved to:', outputPath);
    
    // 6. Report metrics
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

