# 🔍 Prompt Flow Diagnostic

## Current Flow When User Clicks Reference Image

### 1. **Frontend (page.tsx)**
```
User clicks reference image
   ↓
handleReferenceImageClick() is triggered
   ↓
FormData created with:
   - image: base64Data (user photo)
   - mimeType: image/jpeg
   - referenceImageUrl: "https://..." (celebrity photo URL)
   - sessionId: "session-123..."
   - useDynamicPrompts: "true" ✅
   ↓
POST to /api/generate-variations-stream
```

### 2. **Backend (generate-variations-stream/route.ts)**

#### Line 69: Check if dynamic prompts should be used
```typescript
if (useDynamicPrompts === 'true' && referenceImageUrl) {
```

#### Lines 75-76: Analyze reference image
```typescript
const referenceDescription = await analyzeReferenceImage(apiKey, referenceImageUrl);
console.log('✅ Reference description:', referenceDescription);
```
**Expected output:** 
```
✅ Reference description: long blonde wavy hair with side part
```

#### Lines 79-80: Generate custom prompts
```typescript
const customPrompts = generateCustomPrompts(referenceDescription);
console.log('✅ Generated', customPrompts.length, 'custom prompts');
```

#### Lines 83-88: Save to database
```typescript
const strategyIds = await createDynamicStrategies(
  referenceDescription,
  customPrompts,
  sessionId
);
console.log('✅ Created dynamic strategies:', strategyIds);
```

#### Lines 91: Load strategies
```typescript
selectedStrategies = await getStrategiesByIds(strategyIds);
```

### 3. **Generation (Lines 118-144)**

For each strategy, builds this structure:
```
parts: [
  { text: "USER PHOTO:" },
  userImagePart,                    // User's uploaded photo
  { text: "REFERENCE PHOTO:" },
  referenceImagePart,               // Celebrity reference photo
  { text: finalPrompt }             // Custom prompt with description
]
```

---

## 🔴 **POTENTIAL ISSUES**

### Issue #1: Migration 007 Not Run
**Symptom:** Strategies created but columns don't exist
```
Error creating dynamic prompts, falling back to active strategies
```
**Fix:** Run migration 007 in Supabase

### Issue #2: Reference Image Order Confusion
**Problem:** Prompts say "first image" and "second image" but the order is:
1. USER PHOTO (first)
2. REFERENCE PHOTO (second)
3. Text prompt

**Current prompts say:**
- "Look at the reference hairstyle in the **second image**" ✅ CORRECT
- "Take the person in the **first image**" ✅ CORRECT

**This should be OK!**

### Issue #3: Prompt Too Verbose?
The generated prompts embed the description multiple times:

**Example:**
```
Task: Hairstyle transformation to long blonde wavy hair with side part

Step 1: Identify the person in the first image
Step 2: Analyze the hairstyle in the second reference image (long blonde wavy hair with side part)
Step 3: Remove the current hair from person in first image
Step 4: Apply the reference hairstyle (long blonde wavy hair with side part) from second image onto person from first image
Step 5: Match the color, texture, length, and styling EXACTLY

Result: Person from image 1 with long blonde wavy hair with side part from image 2. Face unchanged.
```

**Issue:** Repeats "long blonde wavy hair" 4 times. Might be confusing Gemini.

---

## 🔧 **DEBUGGING STEPS**

### Step 1: Check Dev Server Console

Look for these logs when you click a reference image:

```bash
🔍 Analyzing reference image for dynamic prompts...
✅ Reference description: [WHAT DOES IT SAY HERE?]
✅ Generated 4 custom prompts
✅ Created dynamic strategies: [array of IDs]
```

**If you DON'T see these logs:**
- Check: Is `useDynamicPrompts` being sent as `'true'`? (check Network tab)
- Check: Is `referenceImageUrl` present?
- Check: Did migration 007 run?

### Step 2: Check What Description Is Generated

The `analyzeReferenceImage` function asks Gemini:
```
"Analyze the hairstyle in this image. Describe it concisely, 
focusing on key attributes like length, color, texture, and style."
```

**Examples of good descriptions:**
- ✅ "long blonde wavy hair with a side part"
- ✅ "short black spiky hair with an undercut"
- ✅ "medium length brown hair with highlights and beachy waves"

**Examples of bad descriptions:**
- ❌ "A person with nice hair"
- ❌ "Celebrity hairstyle from 2020"
- ❌ Too long (>100 words)

### Step 3: Check Network Tab

When you click reference:
1. Open Chrome DevTools → Network
2. Click reference image
3. Find `generate-variations-stream` request
4. Check FormData:
   - `useDynamicPrompts`: should be `"true"`
   - `referenceImageUrl`: should be full URL

### Step 4: Check Supabase Database

After generation:
```sql
SELECT 
  name, 
  prompt_template,
  reference_description,
  prompt_style
FROM generation_strategies
WHERE created_for_session IS NOT NULL
ORDER BY created_at DESC
LIMIT 4;
```

You should see 4 strategies with:
- Different `prompt_style` (explicit, step-by-step, aggressive, salon)
- Same `reference_description` (the analyzed description)
- `prompt_template` containing the description

---

## 🎯 **WHAT TO CHECK NOW**

1. **Run the app and click a reference image**
2. **Check your dev server terminal** - what logs appear?
3. **Share with me:**
   - The console logs (especially "Reference description")
   - Whether you see fallback message
   - Any errors

This will tell us EXACTLY where the flow is breaking! 🔍

