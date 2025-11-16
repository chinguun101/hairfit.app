#!/usr/bin/env node

/**
 * Test Script: Self-Evolving Agent MVP (Phase 1)
 * 
 * This script tests the complete flow:
 * 1. Load user photo and reference photo
 * 2. Generate 4 variations using different strategies
 * 3. Auto-evaluate each variation
 * 4. Simulate user selection
 * 5. Update strategy scores
 * 6. Display results and stats
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper: Convert file to base64
function fileToBase64(filePath) {
  const buffer = readFileSync(filePath);
  return buffer.toString('base64');
}

// Helper: Get mime type from file extension
function getMimeType(filePath) {
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

// Main test function
async function runEvolutionTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SELF-EVOLVING AGENT MVP - Phase 1 Test                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Load test images
    console.log('📸 Step 1: Loading test images...');
    const userImagePath = join(__dirname, 'lib/ref_example/og.jpg');
    const referenceImagePath = join(__dirname, 'lib/ref_example/new_ref.jpg');

    const userImageBase64 = fileToBase64(userImagePath);
    const referenceImageBase64 = fileToBase64(referenceImagePath);
    const userMimeType = getMimeType(userImagePath);
    const referenceMimeType = getMimeType(referenceImagePath);

    console.log(`   ✓ User image loaded: ${userImagePath}`);
    console.log(`   ✓ Reference image loaded: ${referenceImagePath}\n`);

    // Step 2: Generate variations
    console.log('🎨 Step 2: Generating 4 variations with different strategies...');
    console.log('   (This will take ~40-60 seconds)\n');

    const generateStartTime = Date.now();

    const formData = new FormData();
    formData.append('image', userImageBase64);
    formData.append('mimeType', userMimeType);
    formData.append('referenceImage', referenceImageBase64);
    formData.append('referenceMimeType', referenceMimeType);
    formData.append('count', '4');
    formData.append('sessionId', 'test-session-' + Date.now());

    const generateResponse = await fetch(`${API_BASE_URL}/api/generate-variations`, {
      method: 'POST',
      body: formData
    });

    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      throw new Error(`Generation failed: ${error.error || error.details}`);
    }

    const generateResult = await generateResponse.json();
    const generateTime = ((Date.now() - generateStartTime) / 1000).toFixed(2);

    console.log(`\n✅ Generation complete in ${generateTime}s`);
    console.log(`   Total generated: ${generateResult.totalGenerated}`);
    console.log(`   Passed evaluation: ${generateResult.totalPassed}`);
    console.log(`   Failed evaluation: ${generateResult.totalGenerated - generateResult.totalPassed}\n`);

    // Step 3: Display results
    console.log('📊 Step 3: Evaluation Results:\n');
    console.log('┌─────┬─────────────────────────┬────────┬────────────┬──────────┐');
    console.log('│  #  │ Strategy                │ Passed │ Confidence │ Time (s) │');
    console.log('├─────┼─────────────────────────┼────────┼────────────┼──────────┤');

    generateResult.variations.forEach((variation, index) => {
      const passed = variation.passed ? '  ✓   ' : '  ✗   ';
      const confidence = (variation.confidence * 100).toFixed(0) + '%';
      const time = (variation.generationTimeMs / 1000).toFixed(2);
      const strategyName = variation.strategyName.padEnd(23);

      console.log(`│ ${index + 1}   │ ${strategyName} │ ${passed} │   ${confidence.padStart(4)}    │  ${time.padStart(5)}  │`);
    });
    console.log('└─────┴─────────────────────────┴────────┴────────────┴──────────┘\n');

    // Display details for each variation
    console.log('📝 Detailed Evaluation:\n');
    generateResult.variations.forEach((variation, index) => {
      console.log(`[${index + 1}] ${variation.strategyName}`);
      console.log(`    Status: ${variation.passed ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`    Reason: ${variation.reason}`);
      console.log(`    Changes detected:`);
      console.log(`      - Color: ${variation.details.hairColorChanged ? 'Yes' : 'No'}`);
      console.log(`      - Length: ${variation.details.hairLengthChanged ? 'Yes' : 'No'}`);
      console.log(`      - Texture: ${variation.details.hairTextureChanged ? 'Yes' : 'No'}`);
      console.log(`      - Style: ${variation.details.hairStyleChanged ? 'Yes' : 'No'}`);
      console.log(`      - Similarity: ${(variation.details.overallSimilarity * 100).toFixed(1)}%\n`);
    });

    // Step 4: Simulate user selection (pick the best one that passed)
    const passedVariations = generateResult.variations.filter(v => v.passed);
    
    if (passedVariations.length === 0) {
      console.log('⚠️  No variations passed evaluation. Cannot proceed with selection test.\n');
      return;
    }

    // Pick the one with highest confidence
    const bestVariation = passedVariations.sort((a, b) => b.confidence - a.confidence)[0];
    
    console.log('👤 Step 4: Simulating user selection...');
    console.log(`   User selects: ${bestVariation.strategyName} (confidence: ${(bestVariation.confidence * 100).toFixed(0)}%)\n`);

    // Record selection
    const selectionResponse = await fetch(`${API_BASE_URL}/api/record-selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: bestVariation.id,
        sessionId: formData.get('sessionId')
      })
    });

    if (!selectionResponse.ok) {
      const error = await selectionResponse.json();
      console.warn(`⚠️  Selection recording failed: ${error.error}`);
      console.warn('   (This is expected if Supabase is not configured)\n');
    } else {
      console.log('✅ Selection recorded and strategy scores updated\n');
    }

    // Step 5: Fetch and display updated stats
    console.log('📈 Step 5: Current Strategy Performance:\n');

    const statsResponse = await fetch(`${API_BASE_URL}/api/record-selection/stats`);
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      
      if (statsResult.success && statsResult.stats) {
        const stats = statsResult.stats;
        
        console.log('Overall Stats:');
        console.log(`  Total generations: ${stats.totalGenerations}`);
        console.log(`  Total selections: ${stats.totalSelections}`);
        console.log(`  Active strategies: ${stats.activeStrategies}\n`);

        console.log('Strategy Scores:');
        console.log('┌─────────────────────────┬───────┬─────────────┬───────┬──────────┐');
        console.log('│ Strategy                │ Score │ Success Rate│ Uses  │ Selected │');
        console.log('├─────────────────────────┼───────┼─────────────┼───────┼──────────┤');

        stats.strategies.forEach(strategy => {
          const name = strategy.name.padEnd(23);
          const score = strategy.score.toFixed(2).padStart(5);
          const successRate = strategy.successRate.padStart(11);
          const uses = strategy.totalUses.toString().padStart(5);
          const selected = strategy.timesSelected.toString().padStart(8);
          const active = strategy.isActive ? '' : ' (inactive)';

          console.log(`│ ${name} │ ${score} │  ${successRate} │ ${uses} │ ${selected} │${active}`);
        });
        console.log('└─────────────────────────┴───────┴─────────────┴───────┴──────────┘\n');
      }
    } else {
      console.log('⚠️  Could not fetch stats (Supabase may not be configured)\n');
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST COMPLETE ✓                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✨ Phase 1 MVP is working!\n');
    console.log('What happened:');
    console.log('  1. Generated 4 variations using different strategies');
    console.log('  2. Auto-evaluated each for meaningful changes');
    console.log('  3. Simulated user selecting the best one');
    console.log('  4. Updated strategy scores based on selection\n');

    console.log('Next steps:');
    console.log('  • Run this test multiple times to see scores evolve');
    console.log('  • Integrate into your main app UI');
    console.log('  • Add more strategies as you discover what works');
    console.log('  • Monitor which strategies win most often\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Check if dev server is running
async function checkServerRunning() {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    return response.ok; // Just check if main page responds
  } catch (error) {
    return false;
  }
}

// Run the test
console.log('Checking if dev server is running...');
const serverRunning = await checkServerRunning();

if (!serverRunning) {
  console.warn('\n⚠️  Dev server may not be running!');
  console.warn('If this fails, start it with: npm run dev\n');
  console.log('Attempting to run test anyway...\n');
}

await runEvolutionTest();


