-- Migration: Self-Evolving Generation System
-- Phase 1: MVP for multi-prompt generation and user feedback

-- Table: generation_strategies
-- Stores different AI models and prompt templates that compete
CREATE TABLE IF NOT EXISTS generation_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL, -- e.g., 'gemini-2.5-flash-image'
  prompt_template TEXT NOT NULL,
  score FLOAT DEFAULT 0.5, -- 0-1, updated based on user selections
  success_count INT DEFAULT 0, -- Number of times user selected this strategy
  total_generations INT DEFAULT 0, -- Total times this strategy was used
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: generation_attempts
-- Records every generation attempt across all strategies
CREATE TABLE IF NOT EXISTS generation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES analysis_sessions(id),
  strategy_id UUID REFERENCES generation_strategies(id),
  reference_image_url TEXT, -- URL or path to reference image used
  output_image_url TEXT, -- Generated result
  evaluation_passed BOOLEAN, -- Did auto-eval determine this succeeded?
  evaluation_confidence FLOAT, -- 0-1 confidence from evaluator
  evaluation_details JSONB, -- Detailed eval results
  user_selected BOOLEAN DEFAULT false, -- THE KEY FEEDBACK SIGNAL
  generation_time_ms INT,
  error_message TEXT, -- If generation failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_strategies_active_score ON generation_strategies(is_active, score DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_strategies_performance ON generation_strategies(success_count DESC, total_generations);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON generation_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_strategy ON generation_attempts(strategy_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_selected ON generation_attempts(user_selected) WHERE user_selected = true;

-- Function: Update strategy score based on user selection
CREATE OR REPLACE FUNCTION update_strategy_score(
  p_winner_id UUID,
  p_loser_ids UUID[]
)
RETURNS void AS $$
DECLARE
  loser_id UUID;
BEGIN
  -- Increment winner's success count and total
  UPDATE generation_strategies
  SET 
    success_count = success_count + 1,
    total_generations = total_generations + 1,
    score = LEAST(1.0, score + 0.05), -- Increase score by 5%, cap at 1.0
    updated_at = NOW()
  WHERE id = p_winner_id;
  
  -- Increment losers' total only, decrease score slightly
  FOREACH loser_id IN ARRAY p_loser_ids
  LOOP
    UPDATE generation_strategies
    SET 
      total_generations = total_generations + 1,
      score = GREATEST(0.1, score - 0.01), -- Decrease by 1%, floor at 0.1
      updated_at = NOW()
    WHERE id = loser_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Seed initial strategies (4 prompts from our testing)
INSERT INTO generation_strategies (name, model, prompt_template, score) VALUES
('explicit-description', 'gemini-2.5-flash-image', 
'Look at the reference hairstyle in the second image: It has textured, messy, spiky styling with volume on top, tousled appearance, and blonde highlights throughout.

Now, take the person in the first image and give them EXACTLY this hairstyle. Change the hair cut, color, length, texture, and styling to match the reference COMPLETELY. Make it dramatic and obvious.

The face, skin, clothing and background should stay the same. Only change the hair.',
0.5),

('step-by-step', 'gemini-2.5-flash-image',
'Task: Hairstyle transformation

Step 1: Identify the person in the first image
Step 2: Analyze the hairstyle in the second reference image (spiky, textured, blonde highlights, messy styling)
Step 3: Remove the current hair from person in first image
Step 4: Apply the reference hairstyle from second image onto person from first image
Step 5: Match the color, texture, length, and styling EXACTLY

Result: Person from image 1 with hairstyle from image 2. Face unchanged.',
0.5),

('aggressive-transform', 'gemini-2.5-flash-image',
'TRANSFORM THIS HAIR COMPLETELY.

Original: Image 1 - person with current hairstyle
Reference: Image 2 - target hairstyle to achieve

CHANGE THE HAIR TO MATCH IMAGE 2:
- Spiky, textured, messy styling
- Blonde color with highlights  
- Medium length with volume
- Tousled, pieced-out texture

DO NOT be subtle. Make the change DRAMATIC and OBVIOUS. The hair should look completely different.
Face, body, clothing, background = keep identical.
Hair = make it match reference completely.',
0.5),

('photo-editor', 'gemini-2.5-flash-image',
'You are a professional photo editor. Edit the first photo by changing only the hair.

TARGET HAIRSTYLE (from image 2):
- Cut: Medium length, textured layers
- Color: Blonde with highlights
- Style: Spiky, messy, tousled
- Texture: Pieced out, volume on top

Apply this hairstyle to the person in image 1. Make it look natural but clearly different. This is a hairstyle preview/mockup.',
0.5)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions (for anonymous access with RLS)
ALTER TABLE generation_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow anonymous read access
CREATE POLICY "Allow anonymous read strategies" ON generation_strategies FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read attempts" ON generation_attempts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert attempts" ON generation_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update attempts" ON generation_attempts FOR UPDATE USING (true);


