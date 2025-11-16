#!/usr/bin/env node

/**
 * Freepik API Endpoint Discovery Script
 * Tests various model endpoints to see which are available via API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const FREEPIK_API_BASE = 'https://api.freepik.com/v1/ai';

if (!FREEPIK_API_KEY) {
  console.error('❌ FREEPIK_API_KEY not found');
  process.exit(1);
}

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load a small test image
const testImagePath = join(__dirname, 'lib', 'examples', 'original.jpg');
const testImageBase64 = readFileSync(testImagePath).toString('base64');

// Model endpoints to test
const ENDPOINTS_TO_TEST = [
  // Flux models - direct
  { name: 'Flux', endpoint: 'flux', params: { prompt: 'test' } },
  { name: 'Flux 1.1', endpoint: 'flux-1-1', params: { prompt: 'test' } },
  { name: 'Flux Pro', endpoint: 'flux-pro', params: { prompt: 'test' } },
  { name: 'Flux Fast', endpoint: 'flux-fast', params: { prompt: 'test' } },
  { name: 'Flux Realism', endpoint: 'flux-realism', params: { prompt: 'test' } },
  
  // Flux models - text-to-image prefix
  { name: 'Flux (TTI)', endpoint: 'text-to-image/flux', params: { prompt: 'test' } },
  { name: 'Flux 1.1 (TTI)', endpoint: 'text-to-image/flux-1-1', params: { prompt: 'test' } },
  { name: 'Flux Pro (TTI)', endpoint: 'text-to-image/flux-pro', params: { prompt: 'test' } },
  { name: 'Flux Fast (TTI)', endpoint: 'text-to-image/flux-fast', params: { prompt: 'test' } },
  { name: 'Flux Realism (TTI)', endpoint: 'text-to-image/flux-realism', params: { prompt: 'test' } },
  { name: 'Flux Kontext (TTI)', endpoint: 'text-to-image/flux-kontext', params: { prompt: 'test' } },
  
  // Google Imagen models
  { name: 'Imagen', endpoint: 'imagen', params: { prompt: 'test' } },
  { name: 'Imagen 3', endpoint: 'imagen-3', params: { prompt: 'test' } },
  { name: 'Imagen 4', endpoint: 'imagen-4', params: { prompt: 'test' } },
  { name: 'Imagen (TTI)', endpoint: 'text-to-image/imagen', params: { prompt: 'test' } },
  { name: 'Imagen 3 (TTI)', endpoint: 'text-to-image/imagen-3', params: { prompt: 'test' } },
  { name: 'Imagen 4 (TTI)', endpoint: 'text-to-image/imagen-4', params: { prompt: 'test' } },
  
  // Ideogram models
  { name: 'Ideogram', endpoint: 'ideogram', params: { prompt: 'test' } },
  { name: 'Ideogram 3', endpoint: 'ideogram-3', params: { prompt: 'test' } },
  { name: 'Ideogram (TTI)', endpoint: 'text-to-image/ideogram', params: { prompt: 'test' } },
  { name: 'Ideogram 3 (TTI)', endpoint: 'text-to-image/ideogram-3', params: { prompt: 'test' } },
  
  // Seedream models
  { name: 'Seedream', endpoint: 'seedream', params: { prompt: 'test' } },
  { name: 'Seedream 3', endpoint: 'seedream-3', params: { prompt: 'test' } },
  { name: 'Seedream 4', endpoint: 'seedream-4', params: { prompt: 'test' } },
  { name: 'Seedream (TTI)', endpoint: 'text-to-image/seedream', params: { prompt: 'test' } },
  { name: 'Seedream 3 (TTI)', endpoint: 'text-to-image/seedream-3', params: { prompt: 'test' } },
  { name: 'Seedream 4 (TTI)', endpoint: 'text-to-image/seedream-4', params: { prompt: 'test' } },
  
  // Try Google prefix
  { name: 'Google Imagen (TTI)', endpoint: 'text-to-image/google-imagen', params: { prompt: 'test' } },
  { name: 'Google Imagen 3', endpoint: 'text-to-image/google/imagen-3', params: { prompt: 'test' } },
  { name: 'Google Imagen 4', endpoint: 'text-to-image/google/imagen-4', params: { prompt: 'test' } },
];

/**
 * Test an endpoint
 */
async function testEndpoint(name, endpoint, params) {
  const url = `${FREEPIK_API_BASE}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': FREEPIK_API_KEY,
      },
      body: JSON.stringify(params),
    });

    const statusCode = response.status;
    let result = {
      name,
      endpoint,
      url,
      status: statusCode,
      available: false,
      message: '',
    };

    if (statusCode === 200 || statusCode === 201) {
      result.available = true;
      result.message = '✅ SUCCESS - Endpoint works!';
      const data = await response.json();
      result.taskId = data.data?.task_id;
    } else if (statusCode === 400) {
      const errorData = await response.json();
      const errorMessage = errorData.message || JSON.stringify(errorData);
      
      // 400 with validation error means the endpoint exists but params are wrong
      if (errorMessage.includes('Validation') || errorMessage.includes('invalid_params')) {
        result.available = true;
        result.message = '⚠️  PARTIAL - Endpoint exists but needs different params';
        result.validationError = errorMessage;
      } else {
        result.message = `❌ BAD REQUEST - ${errorMessage}`;
      }
    } else if (statusCode === 404) {
      result.message = '❌ NOT FOUND - Endpoint does not exist';
    } else if (statusCode === 401 || statusCode === 403) {
      result.message = '🔒 AUTH ERROR - API key issue';
    } else if (statusCode === 429) {
      result.message = '⏱️  RATE LIMITED';
    } else {
      const text = await response.text();
      result.message = `❓ ${statusCode} - ${text.substring(0, 100)}`;
    }

    return result;
  } catch (error) {
    return {
      name,
      endpoint,
      url,
      status: 'ERROR',
      available: false,
      message: `💥 ERROR - ${error.message}`,
    };
  }
}

/**
 * Main discovery function
 */
async function discoverEndpoints() {
  console.log('🔍 Freepik API Endpoint Discovery');
  console.log('=' .repeat(60));
  console.log(`Testing ${ENDPOINTS_TO_TEST.length} potential endpoints...\n`);

  const results = [];
  let successCount = 0;
  let partialCount = 0;

  for (let i = 0; i < ENDPOINTS_TO_TEST.length; i++) {
    const { name, endpoint, params } = ENDPOINTS_TO_TEST[i];
    
    process.stdout.write(`[${i + 1}/${ENDPOINTS_TO_TEST.length}] Testing ${name}...`);
    
    const result = await testEndpoint(name, endpoint, params);
    results.push(result);
    
    // Clear line and print result
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    console.log(`[${i + 1}/${ENDPOINTS_TO_TEST.length}] ${result.name}: ${result.message}`);
    
    if (result.available && !result.validationError) {
      successCount++;
    } else if (result.available && result.validationError) {
      partialCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Discovery Summary');
  console.log('='.repeat(60));
  console.log(`Total endpoints tested: ${ENDPOINTS_TO_TEST.length}`);
  console.log(`✅ Fully working: ${successCount}`);
  console.log(`⚠️  Partial (needs param adjustment): ${partialCount}`);
  console.log(`❌ Not available: ${ENDPOINTS_TO_TEST.length - successCount - partialCount}`);

  // Print working endpoints
  const working = results.filter(r => r.available);
  if (working.length > 0) {
    console.log('\n🎉 Available Endpoints:');
    console.log('-'.repeat(60));
    working.forEach(r => {
      console.log(`  • ${r.name}`);
      console.log(`    Endpoint: ${r.endpoint}`);
      console.log(`    URL: ${r.url}`);
      if (r.taskId) {
        console.log(`    Task ID: ${r.taskId}`);
      }
      if (r.validationError) {
        console.log(`    Note: ${r.validationError.substring(0, 200)}...`);
      }
      console.log();
    });
  }

  // Save results to file
  const outputPath = join(__dirname, 'endpoint-discovery-results.json');
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Full results saved to: ${outputPath}`);
}

// Run discovery
discoverEndpoints().catch(console.error);

