import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, isSupabaseConfigured } from './supabase';

// Types
export interface GenerationStrategy {
  id: string;
  name: string;
  model: string;
  prompt_template: string;
  score: number;
  success_count: number;
  total_generations: number;
  is_active: boolean;
}

export interface GenerationAttempt {
  id?: string;
  session_id: string;
  strategy_id: string;
  strategy_name: string;
  reference_image_url: string;
  output_image_url?: string;
  evaluation_passed?: boolean;
  evaluation_confidence?: number;
  evaluation_details?: any;
  user_selected: boolean;
  generation_time_ms?: number;
  error_message?: string;
}

export interface GenerationResult {
  success: boolean;
  strategy: GenerationStrategy;
  output_image?: string; // base64 data URL
  generation_time_ms: number;
  error_message?: string;
}

/**
 * Fetch active generation strategies from database
 * Strategies are weighted by their score for selection
 */
export async function getActiveStrategies(): Promise<GenerationStrategy[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using default strategies');
    return getDefaultStrategies();
  }

  const { data, error } = await supabase
    .from('generation_strategies')
    .select('*')
    .eq('is_active', true)
    .order('score', { ascending: false });

  if (error) {
    console.error('Error fetching strategies:', error);
    return getDefaultStrategies();
  }

  return data || getDefaultStrategies();
}

/**
 * Default strategies (fallback if database not available)
 */
function getDefaultStrategies(): GenerationStrategy[] {
  return [
    {
      id: 'default-1',
      name: 'explicit-description',
      model: 'gemini-2.5-flash-image',
      prompt_template: `Look at the reference hairstyle in the second image: It has textured, messy, spiky styling with volume on top, tousled appearance, and blonde highlights throughout.

Now, take the person in the first image and give them EXACTLY this hairstyle. Change the hair cut, color, length, texture, and styling to match the reference COMPLETELY. Make it dramatic and obvious.

The face, skin, clothing and background should stay the same. Only change the hair.`,
      score: 0.5,
      success_count: 0,
      total_generations: 0,
      is_active: true
    },
    {
      id: 'default-2',
      name: 'step-by-step',
      model: 'gemini-2.5-flash-image',
      prompt_template: `Task: Hairstyle transformation

Step 1: Identify the person in the first image
Step 2: Analyze the hairstyle in the second reference image (spiky, textured, blonde highlights, messy styling)
Step 3: Remove the current hair from person in first image
Step 4: Apply the reference hairstyle from second image onto person from first image
Step 5: Match the color, texture, length, and styling EXACTLY

Result: Person from image 1 with hairstyle from image 2. Face unchanged.`,
      score: 0.5,
      success_count: 0,
      total_generations: 0,
      is_active: true
    },
    {
      id: 'default-3',
      name: 'aggressive-transform',
      model: 'gemini-2.5-flash-image',
      prompt_template: `TRANSFORM THIS HAIR COMPLETELY.

Original: Image 1 - person with current hairstyle
Reference: Image 2 - target hairstyle to achieve

CHANGE THE HAIR TO MATCH IMAGE 2:
- Spiky, textured, messy styling
- Blonde color with highlights  
- Medium length with volume
- Tousled, pieced-out texture

DO NOT be subtle. Make the change DRAMATIC and OBVIOUS. The hair should look completely different.
Face, body, clothing, background = keep identical.
Hair = make it match reference completely.`,
      score: 0.5,
      success_count: 0,
      total_generations: 0,
      is_active: true
    },
    {
      id: 'default-4',
      name: 'photo-editor',
      model: 'gemini-2.5-flash-image',
      prompt_template: `You are a professional photo editor. Edit the first photo by changing only the hair.

TARGET HAIRSTYLE (from image 2):
- Cut: Medium length, textured layers
- Color: Blonde with highlights
- Style: Spiky, messy, tousled
- Texture: Pieced out, volume on top

Apply this hairstyle to the person in image 1. Make it look natural but clearly different. This is a hairstyle preview/mockup.`,
      score: 0.5,
      success_count: 0,
      total_generations: 0,
      is_active: true
    }
  ];
}

/**
 * Generate hairstyle using a specific strategy
 */
export async function generateWithStrategy(
  userImagePart: { inlineData: { mimeType: string; data: string } },
  referenceImagePart: { inlineData: { mimeType: string; data: string } },
  strategy: GenerationStrategy,
  apiKey: string
): Promise<GenerationResult> {
  const startTime = Date.now();

  try {
    console.log(`Generating with strategy: ${strategy.name}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: strategy.model });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: strategy.prompt_template },
          userImagePart,
          referenceImagePart
        ]
      }],
    });

    const response = result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
      const { data, mimeType } = imagePart.inlineData;
      const dataUrl = `data:${mimeType};base64,${data}`;
      const generation_time_ms = Date.now() - startTime;

      console.log(`✅ Strategy ${strategy.name} succeeded in ${generation_time_ms}ms`);

      return {
        success: true,
        strategy,
        output_image: dataUrl,
        generation_time_ms
      };
    } else {
      // Check for blocking/safety issues
      const finishReason = response.candidates?.[0]?.finishReason;
      const blockReason = response.promptFeedback?.blockReason;

      const errorMsg = blockReason
        ? `Blocked: ${blockReason}`
        : finishReason !== 'STOP'
          ? `Stopped: ${finishReason}`
          : 'No image returned';

      console.log(`❌ Strategy ${strategy.name} failed: ${errorMsg}`);

      return {
        success: false,
        strategy,
        generation_time_ms: Date.now() - startTime,
        error_message: errorMsg
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Strategy ${strategy.name} error:`, errorMsg);

    return {
      success: false,
      strategy,
      generation_time_ms: Date.now() - startTime,
      error_message: errorMsg
    };
  }
}

/**
 * Generate multiple variations using different strategies
 * Phase 1: Simple approach - try all active strategies
 */
export async function generateMultipleVariations(
  userImagePart: { inlineData: { mimeType: string; data: string } },
  referenceImagePart: { inlineData: { mimeType: string; data: string } },
  apiKey: string,
  count: number = 4
): Promise<GenerationResult[]> {
  console.log(`Starting multi-generation (${count} variations)`);

  // Get active strategies
  const strategies = await getActiveStrategies();

  // For Phase 1 MVP: Just use all available strategies
  const selectedStrategies = strategies.slice(0, count);

  console.log(`Selected strategies: ${selectedStrategies.map(s => s.name).join(', ')}`);

  // Generate in parallel with Promise.allSettled to handle failures gracefully
  const results = await Promise.allSettled(
    selectedStrategies.map(strategy =>
      generateWithStrategy(userImagePart, referenceImagePart, strategy, apiKey)
    )
  );

  // Extract successful results
  const generationResults: GenerationResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Promise rejected - create error result
      return {
        success: false,
        strategy: selectedStrategies[index],
        generation_time_ms: 0,
        error_message: result.reason?.message || 'Promise rejected'
      };
    }
  });

  const successCount = generationResults.filter(r => r.success).length;
  console.log(`Multi-generation complete: ${successCount}/${count} succeeded`);

  return generationResults;
}

/**
 * Save generation attempt to database
 */
export async function saveGenerationAttempt(
  attempt: Omit<GenerationAttempt, 'id'>
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping save');
    return null;
  }

  const { data, error } = await supabase
    .from('generation_attempts')
    .insert(attempt)
    .select('id')
    .single();

  if (error) {
    console.error('Error saving generation attempt:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Record user selection and update strategy scores
 */
export async function recordUserSelection(
  selectedAttemptId: string,
  sessionId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping selection record');
    return false;
  }

  try {
    // 1. Mark the selected attempt
    const { error: updateError } = await supabase
      .from('generation_attempts')
      .update({ user_selected: true })
      .eq('id', selectedAttemptId);

    if (updateError) {
      console.error('Error marking selection:', updateError);
      return false;
    }

    // 2. Get all attempts for this session
    const { data: attempts, error: fetchError } = await supabase
      .from('generation_attempts')
      .select('id, strategy_id, user_selected')
      .eq('session_id', sessionId);

    if (fetchError || !attempts) {
      console.error('Error fetching session attempts:', fetchError);
      return false;
    }

    // 3. Find winner and losers
    const winner = attempts.find(a => a.user_selected);
    const losers = attempts.filter(a => !a.user_selected);

    if (!winner) {
      console.error('No winner found');
      return false;
    }

    // 4. Update strategy scores using database function
    const { error: scoreError } = await supabase.rpc('update_strategy_score', {
      p_winner_id: winner.strategy_id,
      p_loser_ids: losers.map(l => l.strategy_id)
    });

    if (scoreError) {
      console.error('Error updating scores:', scoreError);
      return false;
    }

    console.log(`✅ User selection recorded and scores updated`);
    return true;
  } catch (error) {
    console.error('Error in recordUserSelection:', error);
    return false;
  }
}

/**
 * Creates dynamic strategies for a specific reference and saves to database
 * @param referenceDescription - Description of the reference hairstyle (e.g., "long blonde wavy hair")
 * @param prompts - Array of custom prompts with styles
 * @param sessionId - Session ID that created these strategies
 * @returns Array of created strategy IDs
 */
export async function createDynamicStrategies(
  referenceDescription: string,
  prompts: Array<{ style: string; template: string }>,
  sessionId: string
): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning dummy IDs');
    return prompts.map((_, i) => `dummy-${i}`);
  }

  try {
    const timestamp = Date.now();
    const strategiesToInsert = prompts.map((prompt, index) => ({
      name: `dynamic-${timestamp}-${index}`,
      model: 'gemini-2.5-flash-image',
      prompt_template: prompt.template,
      reference_description: referenceDescription,
      created_for_session: sessionId,
      prompt_style: prompt.style,
      score: 0.5,
      success_count: 0,
      total_generations: 0,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('generation_strategies')
      .insert(strategiesToInsert)
      .select('id');

    if (error) {
      console.error('Error creating dynamic strategies:', error);
      throw error;
    }

    const strategyIds = data?.map(s => s.id) || [];
    console.log(`✅ Created ${strategyIds.length} dynamic strategies for: ${referenceDescription}`);
    
    return strategyIds;
    
  } catch (error) {
    console.error('Error in createDynamicStrategies:', error);
    throw error;
  }
}

/**
 * Loads specific strategies by their IDs
 * @param strategyIds - Array of strategy IDs to load
 * @returns Array of strategies
 */
export async function getStrategiesByIds(strategyIds: string[]): Promise<GenerationStrategy[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning default strategies');
    return getDefaultStrategies();
  }

  try {
    const { data, error } = await supabase
      .from('generation_strategies')
      .select('*')
      .in('id', strategyIds);

    if (error) {
      console.error('Error fetching strategies by IDs:', error);
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Error in getStrategiesByIds:', error);
    return getDefaultStrategies();
  }
}


