import { GoogleGenerativeAI, GenerateContentResponse } from "@google/generative-ai";
import { UserHairProfile } from "./hairstyles";

// Timeout constants
const API_TIMEOUT_MS = 60000; // 60 seconds for Gemini API calls
const MAX_RETRIES = 2;

/**
 * Utility function to add timeout to promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

/**
 * Retry logic for API calls
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  backoff: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    // Don't retry on certain errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('blocked') || errorMessage.includes('safety')) {
      throw error;
    }
    
    console.log(`Request failed, retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, backoff));
    return retryWithBackoff(fn, retries - 1, backoff * 2);
  }
}

// Helper function to convert a File object to a Gemini API Part
export const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
  
  const arr = dataUrl.split(',');
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
  
  const mimeType = mimeMatch[1];
  const data = arr[1];
  return { inlineData: { mimeType, data } };
};

// Helper to convert base64 string to Gemini API Part
export const base64ToPart = (base64Data: string, mimeType: string): { inlineData: { mimeType: string; data: string; } } => {
  return { inlineData: { mimeType, data: base64Data } };
};

export const handleApiResponse = (
  response: GenerateContentResponse,
  context: string
): string => {
  // 1. Check for prompt blocking first
  if (response.promptFeedback?.blockReason) {
    const { blockReason, blockReasonMessage } = response.promptFeedback;
    const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
    console.error(errorMessage, { response });
    throw new Error(errorMessage);
  }

  // 2. Try to find the image part
  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`Received image data (${mimeType}) for ${context}`);
    return `data:${mimeType};base64,${data}`;
  }

  // 3. If no image, check for other reasons
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
    console.error(errorMessage, { response });
    throw new Error(errorMessage);
  }
  
  // Try to get text content if available
  const textContent = response.candidates?.[0]?.content?.parts?.find(part => 'text' in part);
  const textFeedback = textContent && 'text' in textContent ? textContent.text : null;
  
  const errorMessage = `The AI model did not return an image for the ${context}. ` + 
    (textFeedback 
      ? `The model responded with text: "${textFeedback}"`
      : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");
  console.error(`Model response did not contain an image part for ${context}.`, { response });
  throw new Error(errorMessage);
};

/**
 * Generates a hairstyle transformation using generative AI
 * @param originalImagePart The original image as a Gemini API part
 * @param hairstyleName The name of the hairstyle
 * @param hairstyleDescription The detailed description of the hairstyle
 * @param apiKey The Gemini API key
 * @returns A promise that resolves to the data URL of the transformed image
 */
export const generateHairstyle = async (
  originalImagePart: { inlineData: { mimeType: string; data: string; } },
  hairstyleName: string,
  hairstyleDescription: string,
  apiKey: string
): Promise<string> => {
  console.log(`Starting hairstyle generation: ${hairstyleName}`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  
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

  const textPart = { text: prompt };
  
  console.log(`Sending request to Gemini for: ${hairstyleName}`);
  
  const result = await retryWithBackoff(() =>
    withTimeout(
      model.generateContent({
        contents: [{ role: "user", parts: [originalImagePart, textPart] }],
      }),
      API_TIMEOUT_MS,
      `Hairstyle generation timed out after ${API_TIMEOUT_MS / 1000}s`
    )
  );
  
  const response = result.response;
  console.log(`Received response for: ${hairstyleName}`);
  
  return handleApiResponse(response as any, hairstyleName);
};

/**
 * Analyzes a user's photo to determine hair characteristics
 * @param originalImagePart The original image as a Gemini API part
 * @param apiKey The Gemini API key
 * @returns A promise that resolves to the user's hair profile
 */
export const analyzeUserPhoto = async (
  originalImagePart: { inlineData: { mimeType: string; data: string; } },
  apiKey: string
): Promise<UserHairProfile> => {
  console.log('Starting photo analysis for user hair profile');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `You are an expert hair stylist and photo analyzer. Analyze the person in this photo and determine their hair characteristics for hairstyle recommendations.

Analyze and provide ONLY a JSON response with these exact fields:

{
  "faceShape": "<one of: oval, round, square, heart, long, diamond>",
  "texture": "<one of: straight, wavy, curly, coily>",
  "density": "<one of: low, medium, high>"
}

Guidelines:
- Face Shape: Assess the overall face proportions and jawline structure
  - oval: balanced proportions, gently rounded jawline
  - round: full cheeks, soft jawline, similar width and length
  - square: strong jawline, angular features
  - heart: wider forehead, pointed chin
  - long: face length notably greater than width
  - diamond: narrow forehead and jawline, wider cheekbones

- Texture: Based on visible hair pattern or typical texture for this person
  - straight: hair falls straight with minimal wave
  - wavy: loose S-shaped waves
  - curly: defined curls or spirals
  - coily: tight coils or zig-zag pattern

- Density: Overall hair volume and thickness
  - low: fine, thin hair with visible scalp
  - medium: moderate thickness and coverage
  - high: thick, full hair with substantial volume

Return ONLY valid JSON, no other text.`;

  const textPart = { text: prompt };
  
  console.log('Sending photo to Gemini for analysis');
  
  const result = await retryWithBackoff(() =>
    withTimeout(
      model.generateContent({
        contents: [{ role: "user", parts: [originalImagePart, textPart] }],
      }),
      API_TIMEOUT_MS,
      `Photo analysis timed out after ${API_TIMEOUT_MS / 1000}s`
    )
  );
  
  const response = result.response;
  const text = response.text();
  
  console.log('Received analysis response:', text);
  
  // Parse the JSON response
  try {
    // Clean the response in case there's markdown or extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const profile = JSON.parse(jsonMatch[0]) as UserHairProfile;
    
    // Validate the response
    if (!profile.faceShape || !profile.texture || !profile.density) {
      throw new Error('Invalid profile structure');
    }
    
    console.log('Successfully parsed user profile:', profile);
    return profile;
  } catch (error) {
    console.error('Error parsing analysis response:', error);
    // Return a safe default profile
    console.log('Using default profile as fallback');
    return {
      faceShape: "oval",
      texture: "wavy",
      density: "medium"
    };
  }
};

