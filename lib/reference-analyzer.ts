import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Analyzes a reference hairstyle image to get a quick description
 * Used to generate custom prompts tailored to the specific reference
 */
export async function analyzeReferenceImage(
  apiKey: string,
  referenceImageUrl: string
): Promise<string> {
  try {
    console.log('🔍 Analyzing reference image...');
    
    // Download reference image
    const response = await fetch(referenceImageUrl);
    if (!response.ok) {
      throw new Error('Failed to download reference image');
    }
    
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    // Analyze with Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const analysisPrompt = `Analyze this hairstyle image and provide a BRIEF description (one sentence, 10-15 words max).

Focus on:
- Hair length (short/medium/long)
- Hair color (blonde/brown/black/red/etc)
- Hair texture (straight/wavy/curly)
- Key style features (layered/bangs/updo/etc)

Example outputs:
- "long blonde wavy hair with beachy waves"
- "short black pixie cut with side-swept bangs"
- "medium brown curly hair with layers"
- "long straight red hair with center part"

Return ONLY the description, no other text.`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: analysisPrompt }
        ]
      }]
    });

    const description = result.response.text().trim();
    console.log('✅ Reference analyzed:', description);
    
    return description;
    
  } catch (error) {
    console.error('Error analyzing reference image:', error);
    // Return fallback description
    return 'styled hair from reference image';
  }
}

