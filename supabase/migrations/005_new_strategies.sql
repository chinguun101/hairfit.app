-- Migration: Additional Evolution Strategies
-- New experimental prompts to test after initial 4

-- Generation 1: More experimental strategies
INSERT INTO generation_strategies (name, model, prompt_template, score, is_active) VALUES

('command-imperative', 'gemini-2.5-flash-image',
'COMMAND: Transfer hairstyle from Reference Image to Subject Image.

REFERENCE HAIRSTYLE: Analyze image 2 completely
SUBJECT: Person in image 1

REQUIRED CHANGES:
✓ Copy hair cut exactly
✓ Copy hair color precisely  
✓ Copy hair texture accurately
✓ Copy styling method completely

PROHIBITED CHANGES:
✗ Do not alter face
✗ Do not alter skin
✗ Do not alter body
✗ Do not alter background

Execute transformation now.',
0.5, false), -- Start inactive

('visual-clone', 'gemini-2.5-flash-image',
'Visual cloning task: Clone the hairstyle from image 2 onto the person in image 1.

Cloning parameters:
- Source: Reference photo (image 2)
- Target: User photo (image 1)  
- Element to clone: Hair only (cut, color, style, texture)
- Preserve: Everything except hair

Make the transformation obvious and dramatic. The goal is to make it look like the person got the exact same hairstyle as the reference.',
0.5, false),

('before-after', 'gemini-2.5-flash-image',
'Create a BEFORE → AFTER transformation.

BEFORE (image 1): Current hairstyle
AFTER (should look like): Reference hairstyle (image 2)

Transform the BEFORE into the AFTER by:
1. Completely removing current hairstyle
2. Replacing with reference hairstyle
3. Maintaining face, skin, and background identical

Think of this as a salon transformation photo. Make it dramatic enough that people would say "Wow, what a change!"',
0.5, false),

('hair-swap', 'gemini-2.5-flash-image',
'HAIR SWAP OPERATION

Person A (image 1): Has hair X
Person B (image 2): Has hair Y  

Task: Give Person A the same hair as Person B

Steps:
→ Remove hair X from Person A
→ Add hair Y to Person A
→ Result: Person A now has hair Y

The swap should be seamless and realistic. Hair color, length, cut, and style must match the reference exactly.',
0.5, false),

('ultra-dramatic', 'gemini-2.5-flash-image',
'MAXIMUM TRANSFORMATION DIRECTIVE

⚠️ IMPORTANT: Make this change EXTREMELY obvious and dramatic!

Reference hairstyle (image 2) must be copied EXACTLY onto person (image 1).

DO:
• Change hair color completely
• Change hair length significantly  
• Change hair texture dramatically
• Change hair style obviously
• Make it look like a totally different person (hair-wise only)

DON\'T:
• Leave any similarity to original hair
• Be subtle or conservative
• Keep the same general look

This is a DRAMATIC before/after. Go BIG!',
0.5, false),

('salon-preview', 'gemini-2.5-flash-image',
'You are creating a virtual salon preview.

Customer (image 1): Wants to see how they would look with a new hairstyle
Reference (image 2): The hairstyle they want

Create a realistic salon preview showing:
- Customer\'s face and features (unchanged)
- New hairstyle from reference (copied exactly)
- Professional, natural-looking result

This is what they would show a customer: "This is how you\'ll look after we do your hair." Make it convincing and accurate.',
0.5, false)

ON CONFLICT (name) DO NOTHING;

-- Function to activate next strategy in rotation
CREATE OR REPLACE FUNCTION activate_next_strategy()
RETURNS UUID AS $$
DECLARE
  next_strategy_id UUID;
BEGIN
  -- Find first inactive strategy and activate it
  SELECT id INTO next_strategy_id
  FROM generation_strategies
  WHERE is_active = false
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF next_strategy_id IS NOT NULL THEN
    UPDATE generation_strategies
    SET is_active = true, updated_at = NOW()
    WHERE id = next_strategy_id;
  END IF;
  
  RETURN next_strategy_id;
END;
$$ LANGUAGE plpgsql;

-- Function to retire poor performers (score < 0.3)
CREATE OR REPLACE FUNCTION retire_poor_performers()
RETURNS TABLE(retired_id UUID, retired_name TEXT) AS $$
BEGIN
  RETURN QUERY
  UPDATE generation_strategies
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true 
    AND score < 0.3
    AND total_generations >= 5  -- Must have at least 5 attempts
  RETURNING id, name;
END;
$$ LANGUAGE plpgsql;

-- Function to evolve strategies (run every 5 sessions)
CREATE OR REPLACE FUNCTION evolve_strategies()
RETURNS JSONB AS $$
DECLARE
  total_attempts INT;
  total_selections INT;
  retired_count INT;
  activated_count INT;
  result JSONB;
BEGIN
  -- Count total user selections (this is the true session count)
  SELECT COUNT(*) INTO total_selections 
  FROM generation_attempts 
  WHERE user_selected = true;
  
  -- Only evolve every 5 selections (5 sessions)
  IF total_selections < 5 OR total_selections % 5 != 0 THEN
    RETURN jsonb_build_object(
      'evolved', false,
      'reason', 'Not at evolution checkpoint',
      'total_selections', total_selections,
      'next_evolution_at', (((total_selections / 5) + 1) * 5)
    );
  END IF;
  
  -- Retire poor performers
  SELECT COUNT(*) INTO retired_count
  FROM retire_poor_performers();
  
  -- Activate new strategies to replace retired ones
  activated_count := 0;
  WHILE activated_count < retired_count AND activated_count < 2 LOOP
    IF activate_next_strategy() IS NOT NULL THEN
      activated_count := activated_count + 1;
    ELSE
      EXIT; -- No more inactive strategies
    END IF;
  END LOOP;
  
  -- Return evolution summary
  result := jsonb_build_object(
    'evolved', true,
    'total_selections', total_selections,
    'retired_count', retired_count,
    'activated_count', activated_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

