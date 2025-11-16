/**
 * Freepik API Client for Gemini 2.5 Flash Image Generation
 * Documentation: https://docs.freepik.com/api-reference/text-to-image/google/post-gemini-2-5-flash-image-preview
 */

// Configuration constants
const FREEPIK_API_BASE = 'https://api.freepik.com/v1/ai';
const GEMINI_ENDPOINT = `${FREEPIK_API_BASE}/gemini-2-5-flash-image-preview`;
const MYSTIC_ENDPOINT = `${FREEPIK_API_BASE}/mystic`;
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_POLL_ATTEMPTS = 60; // Max 3 minutes (60 * 3s)
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds for initial request

/**
 * Task status types from Freepik API
 */
export type FreepikTaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * Response from task submission
 */
export interface FreepikTaskResponse {
  data: {
    task_id: string;
    status: FreepikTaskStatus;
  };
}

/**
 * Response from task status check
 */
export interface FreepikTaskStatusResponse {
  data: {
    task_id: string;
    status: FreepikTaskStatus;
    generated?: string[]; // Array of generated image URLs
    error?: string;
  };
}

/**
 * Request payload for Gemini image generation
 */
export interface FreepikGenerationRequest {
  prompt: string;
  reference_images?: string[]; // Base64 strings or URLs
  webhook_url?: string;
}

/**
 * Request payload for Mystic image generation
 */
export interface MysticGenerationRequest {
  prompt: string;
  resolution?: '1k' | '2k' | '4k'; // Image resolution
  model?: 'realism' | 'fluid' | 'zen'; // AI model variant
  aspect_ratio?: 'square_1_1' | 'classic_4_3' | 'traditional_3_4' | 'widescreen_16_9' | 'social_story_9_16' | 
                 'smartphone_horizontal_20_9' | 'smartphone_vertical_9_20' | 'film_horizontal_21_9' | 
                 'film_vertical_9_21' | 'standard_3_2' | 'portrait_2_3' | 'horizontal_2_1' | 'vertical_1_2' | 
                 'social_5_4' | 'social_post_4_5';
  style_reference?: string; // Base64-encoded image to guide style
  structure_reference?: string; // Base64-encoded image to guide structure
  adherence?: number; // 0-100, how closely to follow the prompt
  creative_detailing?: number; // 0-100, level of creative detail
  structure_strength?: number; // 0-100, strength of structure reference influence
  webhook_url?: string;
}

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
 * Convert a base64 data URL to plain base64 string (remove data:image/...;base64, prefix)
 */
function extractBase64FromDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    const parts = dataUrl.split(',');
    return parts.length > 1 ? parts[1] : dataUrl;
  }
  return dataUrl;
}

/**
 * Submit an image generation task to Freepik's Gemini 2.5 Flash endpoint
 * @param apiKey Freepik API key
 * @param request Generation request parameters
 * @returns Task ID for polling
 */
export async function submitFreepikTask(
  apiKey: string,
  request: FreepikGenerationRequest
): Promise<string> {
  console.log('Submitting task to Freepik Gemini endpoint...');
  console.log('Prompt:', request.prompt);
  
  // Clean reference images (remove data URL prefixes if present)
  const cleanedRequest = {
    ...request,
    reference_images: request.reference_images?.map(extractBase64FromDataUrl)
  };

  const response = await withTimeout(
    fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': apiKey,
      },
      body: JSON.stringify(cleanedRequest),
    }),
    REQUEST_TIMEOUT_MS,
    'Task submission timed out'
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit task: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const data: FreepikTaskResponse = await response.json();
  console.log('Task submitted successfully. Task ID:', data.data.task_id);
  
  return data.data.task_id;
}

/**
 * Check the status of a task
 * @param apiKey Freepik API key
 * @param taskId Task ID to check
 * @returns Task status response
 */
export async function checkTaskStatus(
  apiKey: string,
  taskId: string
): Promise<FreepikTaskStatusResponse> {
  const response = await fetch(`${GEMINI_ENDPOINT}/${taskId}`, {
    method: 'GET',
    headers: {
      'x-freepik-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check task status: ${response.status} ${response.statusText}. ${errorText}`);
  }

  return await response.json();
}

/**
 * Poll a task until completion or failure
 * @param apiKey Freepik API key
 * @param taskId Task ID to poll
 * @returns Array of generated image URLs
 */
export async function pollTaskUntilComplete(
  apiKey: string,
  taskId: string
): Promise<string[]> {
  console.log('Polling task status...');
  
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const statusResponse = await checkTaskStatus(apiKey, taskId);
    const status = statusResponse.data.status;
    
    console.log(`Attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS}: Status = ${status}`);

    if (status === 'COMPLETED') {
      if (!statusResponse.data.generated || statusResponse.data.generated.length === 0) {
        throw new Error('Task completed but no images were generated');
      }
      console.log(`Task completed! Generated ${statusResponse.data.generated.length} image(s)`);
      return statusResponse.data.generated;
    }

    if (status === 'FAILED') {
      const errorMessage = statusResponse.data.error || 'Unknown error';
      throw new Error(`Task failed: ${errorMessage}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Task polling timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000} seconds`);
}

/**
 * Generate an image using Freepik's Gemini 2.5 Flash model (all-in-one function)
 * @param apiKey Freepik API key
 * @param request Generation request parameters
 * @returns Array of generated image URLs
 */
export async function generateImageWithFreepik(
  apiKey: string,
  request: FreepikGenerationRequest
): Promise<string[]> {
  const startTime = Date.now();
  
  try {
    // Submit task
    const taskId = await submitFreepikTask(apiKey, request);
    
    // Poll until complete
    const imageUrls = await pollTaskUntilComplete(apiKey, taskId);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total generation time: ${duration}s`);
    
    return imageUrls;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`Generation failed after ${duration}s:`, error);
    throw error;
  }
}

/**
 * Generate a hairstyle transformation using Freepik's Gemini endpoint
 * @param apiKey Freepik API key
 * @param originalImageBase64 Base64 string of the original photo
 * @param hairstyleName Name of the target hairstyle
 * @param hairstyleDescription Detailed description of the hairstyle
 * @returns Generated image URL
 */
export async function generateHairstyleWithFreepik(
  apiKey: string,
  originalImageBase64: string,
  hairstyleName: string,
  hairstyleDescription: string
): Promise<string> {
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

  const request: FreepikGenerationRequest = {
    prompt,
    reference_images: [extractBase64FromDataUrl(originalImageBase64)]
  };

  const imageUrls = await generateImageWithFreepik(apiKey, request);
  
  // Return the first generated image
  return imageUrls[0];
}

// ============================================================================
// MYSTIC MODEL FUNCTIONS
// ============================================================================

/**
 * Submit an image generation task to Freepik's Mystic endpoint
 * @param apiKey Freepik API key
 * @param request Mystic generation request parameters
 * @returns Task ID for polling
 */
export async function submitMysticTask(
  apiKey: string,
  request: MysticGenerationRequest
): Promise<string> {
  console.log('Submitting task to Freepik Mystic endpoint...');
  console.log('Prompt:', request.prompt);
  console.log('Model:', request.model || 'default');
  console.log('Resolution:', request.resolution || 'default');
  
  // Clean reference images (remove data URL prefixes if present)
  const cleanedRequest = {
    ...request,
    style_reference: request.style_reference ? extractBase64FromDataUrl(request.style_reference) : undefined,
    structure_reference: request.structure_reference ? extractBase64FromDataUrl(request.structure_reference) : undefined,
  };

  const response = await withTimeout(
    fetch(MYSTIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': apiKey,
      },
      body: JSON.stringify(cleanedRequest),
    }),
    REQUEST_TIMEOUT_MS,
    'Mystic task submission timed out'
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit Mystic task: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const data: FreepikTaskResponse = await response.json();
  console.log('Mystic task submitted successfully. Task ID:', data.data.task_id);
  
  return data.data.task_id;
}

/**
 * Check the status of a Mystic task
 * @param apiKey Freepik API key
 * @param taskId Task ID to check
 * @returns Task status response
 */
export async function checkMysticTaskStatus(
  apiKey: string,
  taskId: string
): Promise<FreepikTaskStatusResponse> {
  const response = await fetch(`${MYSTIC_ENDPOINT}/${taskId}`, {
    method: 'GET',
    headers: {
      'x-freepik-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check Mystic task status: ${response.status} ${response.statusText}. ${errorText}`);
  }

  return await response.json();
}

/**
 * Poll a Mystic task until completion or failure
 * @param apiKey Freepik API key
 * @param taskId Task ID to poll
 * @returns Array of generated image URLs
 */
export async function pollMysticTaskUntilComplete(
  apiKey: string,
  taskId: string
): Promise<string[]> {
  console.log('Polling Mystic task status...');
  
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const statusResponse = await checkMysticTaskStatus(apiKey, taskId);
    const status = statusResponse.data.status;
    
    console.log(`Attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS}: Status = ${status}`);

    if (status === 'COMPLETED') {
      if (!statusResponse.data.generated || statusResponse.data.generated.length === 0) {
        throw new Error('Mystic task completed but no images were generated');
      }
      console.log(`Mystic task completed! Generated ${statusResponse.data.generated.length} image(s)`);
      return statusResponse.data.generated;
    }

    if (status === 'FAILED') {
      const errorMessage = statusResponse.data.error || 'Unknown error';
      throw new Error(`Mystic task failed: ${errorMessage}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Mystic task polling timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000} seconds`);
}

/**
 * Generate an image using Freepik's Mystic model (all-in-one function)
 * @param apiKey Freepik API key
 * @param request Mystic generation request parameters
 * @returns Array of generated image URLs
 */
export async function generateImageWithMystic(
  apiKey: string,
  request: MysticGenerationRequest
): Promise<string[]> {
  const startTime = Date.now();
  
  try {
    // Submit task
    const taskId = await submitMysticTask(apiKey, request);
    
    // Poll until complete
    const imageUrls = await pollMysticTaskUntilComplete(apiKey, taskId);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total Mystic generation time: ${duration}s`);
    
    return imageUrls;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`Mystic generation failed after ${duration}s:`, error);
    throw error;
  }
}

/**
 * Generate a hairstyle transformation using Freepik's Mystic endpoint
 * @param apiKey Freepik API key
 * @param originalImageBase64 Base64 string of the original photo
 * @param hairstyleName Name of the target hairstyle
 * @param hairstyleDescription Detailed description of the hairstyle
 * @param options Optional Mystic-specific parameters
 * @returns Generated image URL
 */
export async function generateHairstyleWithMystic(
  apiKey: string,
  originalImageBase64: string,
  hairstyleName: string,
  hairstyleDescription: string,
  options?: {
    resolution?: '1k' | '2k' | '4k';
    model?: 'realism' | 'fluid' | 'zen';
    structure_strength?: number;
  }
): Promise<string> {
  const prompt = `Professional hairstyle transformation. Transform the person's hairstyle to: ${hairstyleName}. ${hairstyleDescription}. Keep face, features, skin tone, clothing, and background exactly the same. Only change the hair. Make it look natural and photorealistic with proper lighting and shadows.`;

  const request: MysticGenerationRequest = {
    prompt,
    structure_reference: extractBase64FromDataUrl(originalImageBase64), // Use structure reference to maintain face/body
    resolution: options?.resolution || '2k',
    model: options?.model || 'realism',
    aspect_ratio: 'portrait_2_3', // Portrait orientation for headshots
    structure_strength: options?.structure_strength || 70, // Balance between maintaining structure and applying changes
    adherence: 85, // High adherence to prompt
    creative_detailing: 60, // Moderate creative detail
  };

  const imageUrls = await generateImageWithMystic(apiKey, request);
  
  // Return the first generated image
  return imageUrls[0];
}

