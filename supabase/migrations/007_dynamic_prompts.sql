-- Migration: Dynamic Prompt Generation System
-- Adds columns to track reference-specific prompts and their styles

-- Add new columns to generation_strategies
ALTER TABLE generation_strategies
ADD COLUMN IF NOT EXISTS reference_description TEXT,
ADD COLUMN IF NOT EXISTS created_for_session TEXT,
ADD COLUMN IF NOT EXISTS prompt_style TEXT;

-- Add index for reference description queries
CREATE INDEX IF NOT EXISTS idx_strategies_reference_description 
ON generation_strategies(reference_description) 
WHERE reference_description IS NOT NULL;

-- Add index for prompt style analytics
CREATE INDEX IF NOT EXISTS idx_strategies_prompt_style 
ON generation_strategies(prompt_style) 
WHERE prompt_style IS NOT NULL;

-- Add index for session tracking
CREATE INDEX IF NOT EXISTS idx_strategies_session 
ON generation_strategies(created_for_session) 
WHERE created_for_session IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN generation_strategies.reference_description IS 'Description of the reference hairstyle this prompt was created for (e.g., "long blonde wavy hair")';
COMMENT ON COLUMN generation_strategies.created_for_session IS 'Session ID that created this dynamic strategy';
COMMENT ON COLUMN generation_strategies.prompt_style IS 'Style of prompt: explicit, step-by-step, aggressive, salon';

