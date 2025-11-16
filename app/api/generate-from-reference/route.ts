import { NextRequest, NextResponse } from 'next/server';
import { base64ToPart } from '@/lib/gemini';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as string; // base64 data of user photo
    const mimeType = formData.get('mimeType') as string;
    const referenceImageUrl = formData.get('referenceImageUrl') as string;
    const celebrityName = formData.get('celebrityName') as string;
    
    if (!imageFile || !mimeType || !referenceImageUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log(`Generating hairstyle from reference: ${celebrityName}`);
    console.log(`Reference URL: ${referenceImageUrl}`);

    // Convert user image to Gemini part
    const userImagePart = base64ToPart(imageFile, mimeType);

    // Download and convert reference image to base64
    console.log('Downloading reference image...');
    const referenceResponse = await fetch(referenceImageUrl);
    if (!referenceResponse.ok) {
      throw new Error('Failed to download reference image');
    }

    const referenceBuffer = await referenceResponse.arrayBuffer();
    const referenceBase64 = Buffer.from(referenceBuffer).toString('base64');
    const referenceMimeType = referenceResponse.headers.get('content-type') || 'image/jpeg';
    
    console.log('Reference image downloaded successfully');

    const referenceImagePart = base64ToPart(referenceBase64, referenceMimeType);

    // Generate with Gemini using both images
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    const prompt = `You are an expert hair stylist and photo editor AI. Your task is to transfer the hairstyle from the reference photo to the person in the user's photo.

REFERENCE PHOTO: This is ${celebrityName}'s hairstyle that we want to recreate.

USER PHOTO: This is the person we want to apply the hairstyle to.

Your Task:
1. Carefully analyze the hairstyle in the REFERENCE photo:
   - Hair length (short/medium/long)
   - Hair texture (straight/wavy/curly)
   - Hair color and highlights
   - Hair style (layered/blunt/shag/etc)
   - Bangs style if present
   - Overall shape and volume

2. Transform ONLY the hair in the USER photo to match the reference hairstyle EXACTLY:
   - Match the length, cut, and shape precisely
   - Match the color and any color variations
   - Match the styling and texture
   - Match the volume and flow
   - Match the bangs or fringe style

3. Keep everything else UNCHANGED:
   - The person's face must remain identical
   - Facial features must not change
   - Skin tone must stay the same
   - Body and clothing must remain unchanged
   - Background must stay the same
   - Lighting should be maintained

4. Ensure the hairstyle looks natural and realistic:
   - The hair should blend naturally with the person's head shape
   - Lighting and shadows should be consistent
   - Hair texture should look photorealistic
   - The style should suit the person's face

Output: Return ONLY the final transformed image with the new hairstyle. Do not return text or explanations.`;

    console.log('Sending generation request to Gemini...');

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: "REFERENCE PHOTO:" },
          referenceImagePart,
          { text: "USER PHOTO:" },
          userImagePart,
          { text: prompt }
        ]
      }],
    });

    const response = result.response;
    
    // Extract the generated image
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    
    if (!imagePart?.inlineData) {
      const finishReason = response.candidates?.[0]?.finishReason;
      console.error('No image generated. Finish reason:', finishReason);
      throw new Error('Failed to generate hairstyle image. The AI did not return an image.');
    }

    const { mimeType: outputMimeType, data } = imagePart.inlineData;
    const dataUrl = `data:${outputMimeType};base64,${data}`;

    console.log('✅ Hairstyle generated successfully from reference');

    return NextResponse.json({
      success: true,
      image: dataUrl,
      celebrity: celebrityName,
    });

  } catch (error) {
    console.error('Error in generate-from-reference API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
}

