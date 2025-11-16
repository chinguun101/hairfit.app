import { NextRequest, NextResponse } from 'next/server';
import { base64ToPart, generateHairstyle } from '@/lib/gemini';
import { HAIRSTYLES } from '@/lib/hairstyles';
import { uploadHairstyleImage, saveGeneratedHairstyle, isSupabaseConfigured } from '@/lib/supabase';
import { getClientIP, checkDDoSProtection } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Get client IP and check DDoS protection
    const clientIP = getClientIP(request);
    const ddosCheck = await checkDDoSProtection(clientIP);
    
    if (!ddosCheck.allowed) {
      console.log('DDoS protection triggered for IP:', clientIP);
      return NextResponse.json(
        { 
          error: 'Too many requests. Please slow down.',
          retryAfter: ddosCheck.retryAfter
        },
        { 
          status: 429,
          headers: ddosCheck.retryAfter 
            ? { 'Retry-After': ddosCheck.retryAfter.toString() }
            : {}
        }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as string; // base64 data
    const mimeType = formData.get('mimeType') as string;
    const hairstyleId = formData.get('hairstyleId') as string;
    const sessionId = formData.get('sessionId') as string | null; // Optional session ID from analyze-photo
    
    if (!imageFile || !mimeType) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!hairstyleId) {
      return NextResponse.json(
        { error: 'No hairstyle ID provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Find the requested hairstyle
    const hairstyle = HAIRSTYLES.find(h => h.id === parseInt(hairstyleId));
    if (!hairstyle) {
      return NextResponse.json(
        { error: 'Hairstyle not found' },
        { status: 404 }
      );
    }

    // Convert base64 to Gemini part
    const originalImagePart = base64ToPart(imageFile, mimeType);

    try {
      console.log(`Generating hairstyle ${hairstyle.id}: ${hairstyle.name}`);
      const transformedImage = await generateHairstyle(
        originalImagePart,
        hairstyle.name,
        hairstyle.description,
        apiKey
      );

      console.log(`Successfully generated hairstyle ${hairstyle.id}`);
      
      // Save to Supabase if configured and sessionId is provided
      let imageUrl: string | undefined;
      let dbRecordId: string | undefined;
      
      if (isSupabaseConfigured() && sessionId) {
        console.log('Uploading image to Supabase Storage...');
        
        // Upload image to storage
        const { url, error: uploadError } = await uploadHairstyleImage(
          sessionId,
          hairstyle.id,
          transformedImage
        );

        if (uploadError) {
          console.error('Failed to upload image to storage:', uploadError);
        } else if (url) {
          imageUrl = url;
          console.log('Image uploaded successfully:', imageUrl);

          // Save metadata to database
          const { data, error: dbError } = await saveGeneratedHairstyle(
            sessionId,
            hairstyle.id,
            hairstyle.name,
            imageUrl
          );

          if (dbError) {
            console.error('Failed to save hairstyle record to database:', dbError);
          } else if (data) {
            dbRecordId = data.id;
            console.log('Hairstyle record saved with ID:', dbRecordId);
          }
        }
      } else if (!sessionId) {
        console.log('No session ID provided - skipping database save');
      } else {
        console.log('Supabase not configured - skipping database save');
      }
      
      return NextResponse.json({
        id: hairstyle.id,
        name: hairstyle.name,
        image: transformedImage,
        imageUrl: imageUrl, // Storage URL if saved
        recordId: dbRecordId, // Database record ID if saved
        success: true
      });
    } catch (error) {
      console.error(`Error generating hairstyle ${hairstyle.id}:`, error);
      return NextResponse.json({
        id: hairstyle.id,
        name: hairstyle.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  } catch (error) {
    console.error('Error in generate-hairstyles API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

