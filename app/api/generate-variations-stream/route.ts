import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { base64ToPart } from '@/lib/gemini';
import { evaluateTransformation } from '@/lib/evaluator';
import { getActiveStrategies, getStrategiesByIds, createDynamicStrategies } from '@/lib/generation-strategies';
import { analyzeReferenceImage } from '@/lib/reference-analyzer';
import { generateCustomPrompts } from '@/lib/prompt-generator';

// Streaming response for progressive updates
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Hardcoded for testing - REVOKE THIS KEY AFTER!
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBTBpi5NL5bK546ZBDfGbMMf_xyhH7gag0';
        if (!apiKey) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'API key not configured' })}\n\n`));
          controller.close();
          return;
        }

        const formData = await request.formData();
        const imageBase64 = formData.get('image') as string;
        const mimeType = formData.get('mimeType') as string || 'image/jpeg';
        const referenceBase64 = formData.get('referenceImage') as string;
        const referenceImageUrl = formData.get('referenceImageUrl') as string;
        const sessionId = formData.get('sessionId') as string || `session-${Date.now()}`;
        const strategyIdsJson = formData.get('strategyIds') as string;
        const useDynamicPrompts = formData.get('useDynamicPrompts') as string;

        if (!imageBase64 || (!referenceBase64 && !referenceImageUrl)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Missing images' })}\n\n`));
          controller.close();
          return;
        }

        // Send start event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'start', 
          message: 'Starting generation of 8 variations...',
          sessionId 
        })}\n\n`));

        // Prepare user image part
        const userImagePart = base64ToPart(imageBase64, mimeType);
        
        // Prepare reference image part (download from URL if needed)
        let referenceImagePart;
        if (referenceImageUrl) {
          // Download reference image from URL
          const referenceResponse = await fetch(referenceImageUrl);
          if (!referenceResponse.ok) {
            throw new Error('Failed to download reference image');
          }
          const referenceBuffer = await referenceResponse.arrayBuffer();
          const referenceBase64Downloaded = Buffer.from(referenceBuffer).toString('base64');
          const referenceMimeType = referenceResponse.headers.get('content-type') || 'image/jpeg';
          referenceImagePart = base64ToPart(referenceBase64Downloaded, referenceMimeType);
        } else {
          // Use provided base64
          const referenceMimeType = formData.get('referenceMimeType') as string || 'image/jpeg';
          referenceImagePart = base64ToPart(referenceBase64, referenceMimeType);
        }

        // Get strategies - dynamic prompts, specific IDs, or active ones
        let selectedStrategies;
        if (useDynamicPrompts === 'true' && referenceImageUrl) {
          // Generate 8 simple prompts using the proven working approach
          console.log('🎨 Generating 8 variations with simple proven prompt...');
          
          try {
            // Skip analysis - just use a generic description
            const referenceDescription = 'reference hairstyle';
            
            // Generate 8 simple prompts (all the same)
            const customPrompts = generateCustomPrompts(referenceDescription);
            console.log('✅ Generated', customPrompts.length, 'simple prompts');
            
            // Create strategies in database
            const strategyIds = await createDynamicStrategies(
              referenceDescription,
              customPrompts,
              sessionId
            );
            console.log('✅ Created dynamic strategies:', strategyIds);
            
            // Load the newly created strategies
            selectedStrategies = await getStrategiesByIds(strategyIds);
          } catch (error) {
            console.error('Error creating dynamic prompts, falling back to active strategies:', error);
            const strategies = await getActiveStrategies();
            selectedStrategies = strategies.slice(0, 8);
          }
        } else if (strategyIdsJson) {
          // Use specific strategies provided
          const strategyIds = JSON.parse(strategyIdsJson);
          console.log('Loading specific strategies by IDs:', strategyIds);
          selectedStrategies = await getStrategiesByIds(strategyIds);
        } else {
          // Fallback to active strategies
          console.log('No strategy IDs provided, using active strategies');
          const strategies = await getActiveStrategies();
          selectedStrategies = strategies.slice(0, 8);
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'strategies', 
          strategies: selectedStrategies.map(s => s.name)
        })}\n\n`));

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        // Generate all 8 in parallel, but stream results as they complete
        const generationPromises = selectedStrategies.map(async (strategy, index) => {
          const startTime = Date.now();
          
          try {
            // Send "generating" event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'generating',
              index,
              strategyName: strategy.name
            })}\n\n`));

            // Use prompt directly - it should reference the images
            const finalPrompt = `${strategy.prompt_template}\n\nIMPORTANT: You must generate an image. Return ONLY the transformed image, no text.`;

            // Generate
            const result = await model.generateContent({
              contents: [{
                role: "user",
                parts: [
                  { text: "USER PHOTO:" },
                  userImagePart,
                  { text: "REFERENCE PHOTO:" },
                  referenceImagePart,
                  { text: finalPrompt }
                ]
              }]
            });

            const response = result.response;
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

            if (!imagePart?.inlineData) {
              throw new Error('No image generated');
            }

            const { mimeType: outputMimeType, data } = imagePart.inlineData;
            const dataUrl = `data:${outputMimeType};base64,${data}`;
            const generationTime = Date.now() - startTime;

            // Evaluate the result
            const evaluation = await evaluateTransformation(
              apiKey,
              `data:${mimeType};base64,${imageBase64}`,
              dataUrl
            );

            // Send completion event with the result
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete',
              index,
              variation: {
                id: `temp-${index}`,
                strategyName: strategy.name,
                strategyId: strategy.id,
                image: dataUrl,
                passed: evaluation.passed,
                confidence: evaluation.confidence,
                reason: evaluation.reason,
                details: evaluation.details,
                generationTimeMs: generationTime
              }
            })}\n\n`));

            return { success: true, index };

          } catch (error) {
            const generationTime = Date.now() - startTime;
            console.error(`Strategy ${strategy.name} failed:`, error);
            
            // Send error event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error',
              index,
              strategyName: strategy.name,
              error: error instanceof Error ? error.message : 'Generation failed',
              generationTimeMs: generationTime
            })}\n\n`));

            return { success: false, index };
          }
        });

        // Wait for all to complete
        await Promise.all(generationPromises);

        // Send done event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'done',
          message: 'All variations complete!'
        })}\n\n`));

        controller.close();

      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

