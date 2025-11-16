# 📤 Actual Prompts Being Sent to Gemini

## Current Setup

When you click a reference image, here's what Gemini receives:

### Message Structure
```
parts: [
  { text: "USER PHOTO:" },
  [YOUR UPLOADED PHOTO IMAGE],
  { text: "REFERENCE PHOTO:" },
  [CELEBRITY REFERENCE IMAGE],
  { text: "[ONE OF THE 4 CUSTOM PROMPTS]" }
]
```

---

## The 4 Generated Prompts

Assuming the reference is analyzed as: **"long blonde wavy hair with side part"**

### Prompt 1: Explicit Style
```
Look at the reference hairstyle in the second image: long blonde wavy hair with side part.

Now, take the person in the first image and give them EXACTLY this hairstyle. Change the hair cut, color, length, texture, and styling to match the reference COMPLETELY. Make it dramatic and obvious.

The face, skin, clothing and background should stay the same. Only change the hair.
```

### Prompt 2: Step-by-Step Style
```
Task: Hairstyle transformation to long blonde wavy hair with side part

Step 1: Identify the person in the first image
Step 2: Analyze the hairstyle in the second reference image (long blonde wavy hair with side part)
Step 3: Remove the current hair from person in first image
Step 4: Apply the reference hairstyle (long blonde wavy hair with side part) from second image onto person from first image
Step 5: Match the color, texture, length, and styling EXACTLY

Result: Person from image 1 with long blonde wavy hair with side part from image 2. Face unchanged.
```

### Prompt 3: Aggressive Style
```
TRANSFORM THIS HAIR COMPLETELY.

Original: Image 1 - person with current hairstyle
Reference: Image 2 - target hairstyle: long blonde wavy hair with side part

CHANGE THE HAIR TO MATCH IMAGE 2 EXACTLY:
Target: long blonde wavy hair with side part

DO NOT be subtle. Make the change DRAMATIC and OBVIOUS. The hair should look completely different.
Face, body, clothing, background = keep identical.
Hair = transform to long blonde wavy hair with side part from reference image.
```

### Prompt 4: Salon Style
```
You are a professional photo editor creating a virtual salon preview.

Customer (image 1): Wants to see how they would look with a new hairstyle
Reference (image 2): The hairstyle they want - long blonde wavy hair with side part

Create a realistic salon preview showing:
- Customer's face and features (unchanged)
- New hairstyle: long blonde wavy hair with side part from reference (copied exactly)
- Professional, natural-looking result

This is what you would show a customer: "This is how you'll look with long blonde wavy hair with side part." Make it convincing and accurate.
```

---

## 🔍 Analyzing the Issue

### Potential Problem: Image Order Confusion

The prompts reference:
- **"first image"** = USER PHOTO ✅
- **"second image"** = REFERENCE PHOTO ✅

BUT the actual order sent to Gemini is:
```
1. Text: "USER PHOTO:"
2. [User's photo]
3. Text: "REFERENCE PHOTO:"
4. [Celebrity photo]
5. Text: [The prompt]
```

So technically:
- **Image 1** (position 2) = User photo ✅
- **Image 2** (position 4) = Reference photo ✅

**This SHOULD work!** But...

### Alternative Hypothesis: Labels Are Confusing

The text labels "USER PHOTO:" and "REFERENCE PHOTO:" might be:
1. Treated as separate instructions
2. Confusing the model about which image is which
3. Not actually needed

---

## 🧪 Suggested Test

### Option A: Remove the labels entirely
```typescript
// Instead of:
parts: [
  { text: "USER PHOTO:" },
  userImagePart,
  { text: "REFERENCE PHOTO:" },
  referenceImagePart,
  { text: finalPrompt }
]

// Try:
parts: [
  userImagePart,
  referenceImagePart,
  { text: finalPrompt }
]
```

The prompts already say "first image" and "second image", so labels might be redundant.

### Option B: Make labels more explicit
```typescript
parts: [
  { text: "IMAGE 1 (USER TO TRANSFORM):" },
  userImagePart,
  { text: "IMAGE 2 (REFERENCE HAIRSTYLE TO COPY):" },
  referenceImagePart,
  { text: finalPrompt }
]
```

### Option C: Put prompt BEFORE images
```typescript
parts: [
  { text: finalPrompt },
  { text: "\n\nIMAGE 1 (USER):" },
  userImagePart,
  { text: "\n\nIMAGE 2 (REFERENCE):" },
  referenceImagePart
]
```

---

## 📊 What To Check

**In your dev server terminal, look for:**

```bash
🔍 Analyzing reference image for dynamic prompts...
✅ Reference description: [WHAT DOES IT SAY?]
✅ Generated 4 custom prompts
✅ Created dynamic strategies: [...array of IDs...]
```

**Key Questions:**
1. Do you see these logs at all?
2. If yes, what does "Reference description" say?
3. If no, do you see "falling back to active strategies"?

This will tell us if:
- ✅ Dynamic prompts are working
- ✅ Analysis is producing good descriptions
- ❌ Migration 007 hasn't been run
- ❌ Something else is failing

**Share your terminal output and we'll fix it!** 🔧

