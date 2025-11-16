import { NextRequest, NextResponse } from 'next/server';
import { base64ToPart } from '@/lib/gemini';
import { generateMultipleVariations, saveGenerationAttempt } from '@/lib/generation-strategies';
import { evaluateBatch } from '@/lib/evaluator';

export const maxDuration = 300; // 5 minutes for generating multiple variations
export const dynamic = 'force-dynamic';

/**
 * POST /api/generate-variations
 * 
 * Phase 1 MVP: Generate multiple hairstyle variations using different strategies
 * 
 * Body (FormData):
 * - image: base64 data (user's photo)
 * - mimeType: image mime type
 * - referenceImage: base64 data (reference hairstyle)
 * - referenceMimeType: reference image mime type
 * - sessionId: (optional) session ID for tracking
 * - count: (optional) number of variations to generate (default: 4)
 * 
 * Response:
 * {
 *   success: true,
 *   variations: [
 *     {
 *       id: "attempt-id",
 *       strategyName: "explicit-description",
 *       image: "data:image/png;base64,...",
 *       passed: true,
 *       confidence: 0.8,
 *       generationTimeMs: 1234
 *     },
 *     ...
 *   ],
 *   totalGenerated: 4,
 *   totalPassed: 3
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Hardcoded for testing - REVOKE THIS KEY AFTER!
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBTBpi5NL5bK546ZBDfGbMMf_xyhH7gag0';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    
    // Extract parameters
    const imageData = formData.get('image') as string;
    const mimeType = formData.get('mimeType') as string;
    const referenceImageData = formData.get('referenceImage') as string;
    const referenceMimeType = formData.get('referenceMimeType') as string;
    const sessionId = formData.get('sessionId') as string | null;
    const count = parseInt(formData.get('count') as string || '4');

    // Validate inputs
    if (!imageData || !mimeType) {
      return NextResponse.json(
        { error: 'User image is required' },
        { status: 400 }
      );
    }

    if (!referenceImageData || !referenceMimeType) {
      return NextResponse.json(
        { error: 'Reference image is required' },
        { status: 400 }
      );
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Multi-Generation Request`);
    console.log(`   Count: ${count} variations`);
    console.log(`   Session: ${sessionId || 'new'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Convert images to Gemini parts
    const userImagePart = base64ToPart(imageData, mimeType);
    const referenceImagePart = base64ToPart(referenceImageData, referenceMimeType);

    // Phase 1: Generate multiple variations
    console.log('📸 Generating variations...');
    const startTime = Date.now();
    
    const generationResults = await generateMultipleVariations(
      userImagePart,
      referenceImagePart,
      apiKey,
      count
    );

    const generationTime = Date.now() - startTime;
    console.log(`⏱️  Total generation time: ${(generationTime / 1000).toFixed(2)}s`);

    // Filter only successful generations
    const successfulGenerations = generationResults.filter(r => r.success);

    if (successfulGenerations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'All generations failed',
        details: generationResults.map(r => ({
          strategy: r.strategy.name,
          error: r.error_message
        }))
      }, { status: 500 });
    }

    // Phase 2: Evaluate generated images
    console.log(`\n🔍 Evaluating ${successfulGenerations.length} successful generations...`);
    
    const originalDataUrl = `data:${mimeType};base64,${imageData}`;
    const generatedDataUrls = successfulGenerations.map(r => r.output_image!);

    const evaluations = await evaluateBatch(
      apiKey,
      originalDataUrl,
      generatedDataUrls
    );

    // Phase 3: Save attempts to database and prepare response
    console.log('\n💾 Saving generation attempts...');
    
    const variations = await Promise.all(
      successfulGenerations.map(async (result, index) => {
        const evaluation = evaluations[index];
        
        // Save to database if sessionId provided
        let attemptId: string | null = null;
        if (sessionId) {
          attemptId = await saveGenerationAttempt({
            session_id: sessionId,
            strategy_id: result.strategy.id,
            strategy_name: result.strategy.name,
            reference_image_url: 'inline', // Could save to storage in future
            output_image_url: 'inline', // Could save to storage in future
            evaluation_passed: evaluation.passed,
            evaluation_confidence: evaluation.confidence,
            evaluation_details: evaluation.details,
            user_selected: false,
            generation_time_ms: result.generation_time_ms
          });
        }

        return {
          id: attemptId || `temp-${index}`,
          strategyName: result.strategy.name,
          strategyId: result.strategy.id,
          image: result.output_image,
          passed: evaluation.passed,
          confidence: evaluation.confidence,
          reason: evaluation.reason,
          details: evaluation.details,
          generationTimeMs: result.generation_time_ms
        };
      })
    );

    const totalPassed = variations.filter(v => v.passed).length;

    console.log(`\n✅ Multi-generation complete!`);
    console.log(`   Total generated: ${successfulGenerations.length}`);
    console.log(`   Passed evaluation: ${totalPassed}`);
    console.log(`   Failed evaluation: ${successfulGenerations.length - totalPassed}`);
    console.log(`${'='.repeat(60)}\n`);

    return NextResponse.json({
      success: true,
      variations,
      totalGenerated: successfulGenerations.length,
      totalPassed,
      totalGenerationTimeMs: generationTime
    });

  } catch (error) {
    console.error('Error in generate-variations API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


