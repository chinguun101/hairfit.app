-- Migration: Fix prompts to use actual reference images, not hardcoded descriptions
-- These prompts will now properly analyze the reference image instead of using hardcoded descriptions

UPDATE generation_strategies SET prompt_template = 
'Look at the reference hairstyle in the second image carefully.

Now, take the person in the first image and give them EXACTLY this hairstyle. Change the hair cut, color, length, texture, and styling to match the reference COMPLETELY. Make it dramatic and obvious.

The face, skin, clothing and background should stay the same. Only change the hair.'
WHERE name = 'explicit-description';

UPDATE generation_strategies SET prompt_template = 
'Task: Hairstyle transformation

Step 1: Identify the person in the first image
Step 2: Analyze the hairstyle in the second reference image (look at cut, color, length, texture, style)
Step 3: Remove the current hair from person in first image
Step 4: Apply the reference hairstyle from second image onto person from first image
Step 5: Match the color, texture, length, and styling EXACTLY

Result: Person from image 1 with hairstyle from image 2. Face unchanged.'
WHERE name = 'step-by-step';

UPDATE generation_strategies SET prompt_template = 
'TRANSFORM THIS HAIR COMPLETELY.

Original: Image 1 - person with current hairstyle
Reference: Image 2 - target hairstyle to achieve

ANALYZE IMAGE 2 and CHANGE THE HAIR TO MATCH IT EXACTLY:
- Copy the cut and length
- Copy the color and highlights
- Copy the texture and styling
- Copy the volume and shape

DO NOT be subtle. Make the change DRAMATIC and OBVIOUS. The hair should look completely different.
Face, body, clothing, background = keep identical.
Hair = make it match reference completely.'
WHERE name = 'aggressive-transform';

UPDATE generation_strategies SET prompt_template = 
'You are a professional photo editor. Edit the first photo by changing only the hair.

Analyze the TARGET HAIRSTYLE in image 2 carefully and note:
- The cut and length
- The color and any highlights
- The styling and texture
- The volume and shape

Apply this exact hairstyle to the person in image 1. Make it look natural but clearly different. This is a hairstyle preview/mockup.'
WHERE name = 'photo-editor';

