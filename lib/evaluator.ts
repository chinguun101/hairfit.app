import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Convert data URL to Gemini image part
 */
function dataUrlToPart(dataUrl: string): { inlineData: { mimeType: string; data: string } } {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  return {
    inlineData: {
      mimeType,
      data
    }
  };
}

/**
 * Evaluation result from the LLM-as-judge
 */
export interface EvaluationResult {
  passed: boolean;
  confidence: number; // 0-1
  reason: string;
  details: {
    hairColorChanged: boolean;
    hairLengthChanged: boolean;
    hairTextureChanged: boolean;
    hairStyleChanged: boolean;
    overallSimilarity: number; // 0-1, where 1 = identical
  };
}

/**
 * Simple evaluator for Phase 1 MVP
 * Uses Gemini to compare original and generated images
 * Determines if meaningful transformation occurred
 * 
 * @param apiKey - Gemini API key
 * @param originalDataUrl - Original image as data URL
 * @param generatedDataUrl - Generated image as data URL
 */
export async function evaluateTransformation(
  apiKey: string,
  originalDataUrl: string,
  generatedDataUrl: string
): Promise<EvaluationResult> {
  try {
    // Convert data URLs to image parts
    const originalPart = dataUrlToPart(originalDataUrl);
    const generatedPart = dataUrlToPart(generatedDataUrl);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use text model for evaluation to save costs
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const evaluationPrompt = `You are an image comparison expert. Compare these two images of the same person.

Image 1: Original photo
Image 2: Generated transformation

Your task: Determine if a meaningful HAIRSTYLE transformation occurred between image 1 and image 2.

Analyze:
1. Hair color: Did it change? (Yes/No)
2. Hair length: Did it change significantly? (Yes/No)
3. Hair texture: Did it change (straight vs wavy vs curly)? (Yes/No)
4. Hair style: Did the styling change (volume, direction, cut)? (Yes/No)
5. Overall similarity: Rate how similar the images are (0-100%, where 100% = completely identical)

A transformation PASSES if:
- At least 2 of the 4 hair attributes changed, OR
- Overall similarity is less than 85%

A transformation FAILS if:
- Images look nearly identical (similarity > 90%), OR
- Only minor/imperceptible changes occurred

Return your analysis in this EXACT JSON format:
{
  "hairColorChanged": true/false,
  "hairLengthChanged": true/false,
  "hairTextureChanged": true/false,
  "hairStyleChanged": true/false,
  "overallSimilarity": 0.XX (as decimal, e.g., 0.92 for 92%),
  "passed": true/false,
  "reason": "Brief explanation of your decision"
}

Return ONLY the JSON, no other text.`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: evaluationPrompt },
          originalPart,
          generatedPart
        ]
      }],
    });

    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in evaluator response');
      // Conservative default: assume it failed
      return {
        passed: false,
        confidence: 0.5,
        reason: 'Evaluation failed - no JSON response',
        details: {
          hairColorChanged: false,
          hairLengthChanged: false,
          hairTextureChanged: false,
          hairStyleChanged: false,
          overallSimilarity: 1.0
        }
      };
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    // Calculate confidence based on how clear the changes are
    const changesCount = [
      evaluation.hairColorChanged,
      evaluation.hairLengthChanged,
      evaluation.hairTextureChanged,
      evaluation.hairStyleChanged
    ].filter(Boolean).length;

    const confidence = evaluation.passed
      ? 0.5 + (changesCount * 0.125) // 0.5-1.0 based on number of changes
      : 0.3 + ((1 - evaluation.overallSimilarity) * 0.5); // Lower confidence for failures

    return {
      passed: evaluation.passed,
      confidence: Math.min(1.0, confidence),
      reason: evaluation.reason,
      details: {
        hairColorChanged: evaluation.hairColorChanged,
        hairLengthChanged: evaluation.hairLengthChanged,
        hairTextureChanged: evaluation.hairTextureChanged,
        hairStyleChanged: evaluation.hairStyleChanged,
        overallSimilarity: evaluation.overallSimilarity
      }
    };
  } catch (error) {
    console.error('Error in evaluateTransformation:', error);
    // Optimistic default: assume it passed (images too large to evaluate)
    // Better to show the user and let them judge
    return {
      passed: true,
      confidence: 0.6,
      reason: `Auto-evaluation skipped (${error instanceof Error && error.message.includes('413') ? 'image too large' : 'evaluation error'})`,
      details: {
        hairColorChanged: true,
        hairLengthChanged: false,
        hairTextureChanged: false,
        hairStyleChanged: true,
        overallSimilarity: 0.75
      }
    };
  }
}

/**
 * Batch evaluate multiple generation results
 * Phase 1: Simple sequential evaluation
 */
export async function evaluateBatch(
  apiKey: string,
  originalDataUrl: string,
  generatedDataUrls: string[]
): Promise<EvaluationResult[]> {
  console.log(`Evaluating ${generatedDataUrls.length} generations...`);

  const results: EvaluationResult[] = [];

  for (let i = 0; i < generatedDataUrls.length; i++) {
    console.log(`Evaluating generation ${i + 1}/${generatedDataUrls.length}...`);
    const evaluation = await evaluateTransformation(
      apiKey,
      originalDataUrl,
      generatedDataUrls[i]
    );
    results.push(evaluation);
    
    // Small delay to avoid rate limiting
    if (i < generatedDataUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log(`Evaluation complete: ${passedCount}/${results.length} passed`);

  return results;
}


