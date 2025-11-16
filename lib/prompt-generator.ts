/**
 * Prompt generation styles
 */
export type PromptStyle = 'explicit' | 'step-by-step' | 'aggressive' | 'salon';

export interface CustomPrompt {
  style: PromptStyle;
  template: string;
}

/**
 * Generates 8 simple prompts using the proven working approach
 * All use the same strategy that worked before - just passing both images
 * Note: referenceDescription parameter is kept for backwards compatibility but not used
 */
export function generateCustomPrompts(referenceDescription?: string): CustomPrompt[] {
  // The simple prompt that worked: just tell it to copy the reference hairstyle
  const workingPrompt = `Transform the person's hairstyle to match the reference hairstyle exactly. Keep their face, skin tone, and background the same. Only change the hair to match the reference.`;
  
  // Generate 8 variations with the same working strategy
  return Array.from({ length: 8 }, (_, i) => ({
    style: 'explicit' as PromptStyle,
    template: workingPrompt
  }));
}

/**
 * Gets a human-readable name for a prompt style
 */
export function getStyleDisplayName(style: PromptStyle): string {
  const names: Record<PromptStyle, string> = {
    'explicit': 'Explicit Description',
    'step-by-step': 'Step-by-Step',
    'aggressive': 'Aggressive Transform',
    'salon': 'Professional Salon'
  };
  return names[style];
}

