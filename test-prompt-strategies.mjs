import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

function fileToBase64Part(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const imageBuffer = readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return { inlineData: { mimeType, data: base64 } };
}

// Different prompt strategies to test
const PROMPT_STRATEGIES = [
  {
    name: "Explicit Hairstyle Description",
    prompt: `Look at the reference hairstyle in the second image: It has textured, messy, spiky styling with volume on top, tousled appearance, and blonde highlights throughout.

Now, take the person in the first image and give them EXACTLY this hairstyle. Change the hair cut, color, length, texture, and styling to match the reference COMPLETELY. Make it dramatic and obvious.

The face, skin, clothing and background should stay the same. Only change the hair.`
  },
  {
    name: "Copy Command Approach",
    prompt: `COPY the entire hairstyle from image 2 onto the person in image 1.

Hair to copy: messy textured spiky style, blonde with highlights, medium length, volume on top, tousled and pieced out.

Make the hair transformation DRAMATIC and COMPLETE. The person's face stays the same, only the hairstyle changes.`
  },
  {
    name: "Step-by-Step Instructions",
    prompt: `Task: Hairstyle transformation

Step 1: Identify the person in the first image
Step 2: Analyze the hairstyle in the second reference image (spiky, textured, blonde highlights, messy styling)
Step 3: Remove the current hair from person in first image
Step 4: Apply the reference hairstyle from second image onto person from first image
Step 5: Match the color, texture, length, and styling EXACTLY

Result: Person from image 1 with hairstyle from image 2. Face unchanged.`
  },
  {
    name: "Aggressive Transformation",
    prompt: `TRANSFORM THIS HAIR COMPLETELY.

Original: Image 1 - person with current hairstyle
Reference: Image 2 - target hairstyle to achieve

CHANGE THE HAIR TO MATCH IMAGE 2:
- Spiky, textured, messy styling
- Blonde color with highlights  
- Medium length with volume
- Tousled, pieced-out texture

DO NOT be subtle. Make the change DRAMATIC and OBVIOUS. The hair should look completely different.
Face, body, clothing, background = keep identical.
Hair = make it match reference completely.`
  },
  {
    name: "Photo Edit Framing",
    prompt: `You are a professional photo editor. Edit the first photo by changing only the hair.

TARGET HAIRSTYLE (from image 2):
- Cut: Medium length, textured layers
- Color: Blonde with highlights
- Style: Spiky, messy, tousled
- Texture: Pieced out, volume on top

Apply this hairstyle to the person in image 1. Make it look natural but clearly different. This is a hairstyle preview/mockup.`
  }
];

async function testPromptStrategy(strategy, userImagePart, referenceImagePart, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing Strategy ${index + 1}: ${strategy.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n📝 Prompt:\n${strategy.prompt}\n`);
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    
    console.log('⏳ Generating...');
    const startTime = Date.now();
    
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [
          { text: strategy.prompt },
          userImagePart,
          referenceImagePart
        ] 
      }],
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Completed in ${duration}s`);
    
    const response = result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    
    if (imagePart?.inlineData) {
      const { data, mimeType } = imagePart.inlineData;
      const buffer = Buffer.from(data, 'base64');
      const outputPath = join(__dirname, `lib/ref_example/output-strategy-${index + 1}.png`);
      
      writeFileSync(outputPath, buffer);
      const fileSize = (buffer.length / 1024).toFixed(2);
      
      console.log(`💾 Saved: ${outputPath}`);
      console.log(`📦 Size: ${fileSize} KB`);
      return { success: true, path: outputPath };
    } else {
      console.error('❌ No image returned');
      
      // Check for blocking/safety issues
      if (response.promptFeedback?.blockReason) {
        console.error(`⚠️  BLOCKED: ${response.promptFeedback.blockReason}`);
        console.error(`Message: ${response.promptFeedback.blockReasonMessage || 'N/A'}`);
      }
      
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
        console.error(`⚠️  Stopped: ${finishReason}`);
      }
      
      return { success: false, error: 'No image returned' };
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Testing Multiple Prompt Strategies for Reference-Based Generation\n');
  
  // Load images once
  console.log('📸 Loading images...');
  const userImagePart = fileToBase64Part(join(__dirname, 'lib/ref_example/og.jpg'));
  const referenceImagePart = fileToBase64Part(join(__dirname, 'lib/ref_example/new_ref.jpg'));
  console.log('✅ Images loaded\n');
  
  const results = [];
  
  // Test each strategy
  for (let i = 0; i < PROMPT_STRATEGIES.length; i++) {
    const result = await testPromptStrategy(
      PROMPT_STRATEGIES[i],
      userImagePart,
      referenceImagePart,
      i
    );
    
    results.push({
      strategy: PROMPT_STRATEGIES[i].name,
      ...result
    });
    
    // Small delay between requests to avoid rate limiting
    if (i < PROMPT_STRATEGIES.length - 1) {
      console.log('\n⏸️  Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Strategy ${index + 1}: ${result.strategy}`);
    if (result.success) {
      console.log(`   Output: ${result.path}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n${successCount}/${results.length} strategies succeeded`);
  
  if (successCount > 0) {
    console.log('\n🎨 Compare the outputs to see which prompt strategy works best!');
    console.log('Output files: lib/ref_example/output-strategy-1.png through output-strategy-5.png');
  }
}

runAllTests().catch(console.error);


