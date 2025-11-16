import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable not set');
  console.error('Please set it with: export GEMINI_API_KEY=your_api_key');
  process.exit(1);
}

// Convert image file to base64 inlineData part
function fileToBase64Part(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const imageBuffer = readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  console.log(`📸 Loaded ${filePath.split('/').pop()} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
  
  return { inlineData: { mimeType, data: base64 } };
}

// Main test function
async function testReferenceGeneration() {
  console.log('🚀 Starting reference-based hairstyle generation test\n');
  
  try {
    // Load images
    console.log('Loading images...');
    const userImagePart = fileToBase64Part(join(__dirname, 'lib/ref_example/og.jpg'));
    const referenceImagePart = fileToBase64Part(join(__dirname, 'lib/ref_example/new_ref.jpg'));
    
    // Initialize Gemini
    console.log('\n🤖 Initializing Gemini 2.5 Flash Image model...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    
    // Simplified prompt focused on reference copying
    const prompt = `Transform the hairstyle in the first image to match the hairstyle shown in the second reference image. 

Keep everything else about the person unchanged - only change the hairstyle (cut, color, length, and style) to exactly match the reference.

Return ONLY the transformed image.`;

    console.log('\n📝 Prompt:', prompt.substring(0, 100) + '...');
    console.log('\n⏳ Generating image with reference... (this may take 20-30 seconds)');
    
    // Send request with both images
    const startTime = Date.now();
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [
          { text: prompt },
          userImagePart,
          referenceImagePart
        ] 
      }],
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Generation completed in ${duration} seconds`);
    
    // Extract and save result
    const response = result.response;
    console.log('\n🔍 Checking response...');
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    
    if (imagePart?.inlineData) {
      const { data, mimeType } = imagePart.inlineData;
      const buffer = Buffer.from(data, 'base64');
      const outputPath = join(__dirname, 'lib/ref_example/output.png');
      
      writeFileSync(outputPath, buffer);
      const fileSize = (buffer.length / 1024).toFixed(2);
      
      console.log(`✅ Generated image saved to: ${outputPath}`);
      console.log(`📦 File size: ${fileSize} KB`);
      console.log(`🖼️  MIME type: ${mimeType}`);
      console.log('\n🎉 Test completed successfully!');
      console.log('\nYou can now view the result:');
      console.log(`  open ${outputPath}`);
    } else {
      console.error('❌ No image returned from API');
      console.error('Response structure:', JSON.stringify(response, null, 2));
      
      // Check for safety/blocking issues
      if (response.promptFeedback?.blockReason) {
        console.error(`\n⚠️  Request was blocked: ${response.promptFeedback.blockReason}`);
      }
      
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
        console.error(`\n⚠️  Generation stopped: ${finishReason}`);
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during generation:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testReferenceGeneration().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

