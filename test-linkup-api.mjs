/**
 * Test script to debug Linkup API
 * Run with: node test-linkup-api.mjs
 */

import { readFileSync } from 'fs';

// Get API key from command line argument or .env.local
let LINKUP_API_KEY = process.argv[2];

if (!LINKUP_API_KEY) {
  // Try to read from .env.local
  try {
    const envContent = readFileSync('.env.local', 'utf-8');
    const match = envContent.match(/LINKUP_API_KEY=(.+)/);
    if (match) {
      // Remove quotes if present
      LINKUP_API_KEY = match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (error) {
    // .env.local doesn't exist, that's okay
  }
}

if (!LINKUP_API_KEY) {
  console.error('❌ LINKUP_API_KEY not provided');
  console.log('\nUsage: node test-linkup-api.mjs YOUR_API_KEY');
  console.log('Or add LINKUP_API_KEY=your_key to .env.local');
  process.exit(1);
}

console.log('✅ API Key found:', LINKUP_API_KEY.substring(0, 20) + '...');
console.log('\n📡 Testing Linkup API...\n');

async function testLinkupSearch() {
  // Test with the actual celebrity name that's failing
  const query = "Jimin hairstyles different looks hair styles";
  
  console.log('Query:', query);
  console.log('Endpoint: https://api.linkup.so/v1/search');
  console.log('\n🔄 Sending request...\n');

  try {
    const response = await fetch('https://api.linkup.so/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        depth: 'standard',
        outputType: 'searchResults',
        includeImages: true,
      }),
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\n📦 Response Body:\n');

    const responseText = await response.text();
    console.log(responseText);

    if (!response.ok) {
      console.error('\n❌ API Error:', response.status);
      return;
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('\n✅ Parsed JSON successfully');
      console.log('\n🔍 Response Structure:');
      console.log('Keys:', Object.keys(data));
      
      if (data.results) {
        console.log('\n📄 Results count:', data.results.length);
        if (data.results.length > 0) {
          console.log('First result keys:', Object.keys(data.results[0]));
          console.log('First result sample:', JSON.stringify(data.results[0], null, 2).substring(0, 500));
        }
      }
      
      if (data.images) {
        console.log('\n🖼️  Images array:', data.images.length, 'images');
        if (data.images.length > 0) {
          console.log('First image:', data.images[0]);
        }
      } else {
        console.log('\n⚠️  No "images" key in response');
      }

      // Check if images are nested in results
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        if (firstResult.images) {
          console.log('\n🖼️  Images found in results[0].images:', firstResult.images.length);
        }
      }

      console.log('\n📊 Full Response Structure:');
      console.log(JSON.stringify(data, null, 2));

    } catch (parseError) {
      console.error('\n❌ Failed to parse JSON:', parseError.message);
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    console.error('Full error:', error);
  }
}

testLinkupSearch();

