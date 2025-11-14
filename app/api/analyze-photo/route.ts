import { NextRequest, NextResponse } from 'next/server';
import { base64ToPart, analyzeUserPhoto } from '@/lib/gemini';
import { createAnalysisSession, isSupabaseConfigured } from '@/lib/supabase';
import { getClientIP, checkRateLimit, incrementUsageCount } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = getClientIP(request);
    console.log('Request from IP:', clientIP);

    // TEMPORARILY DISABLED - Check rate limits (both DDoS and usage limit)
    // const rateLimitCheck = await checkRateLimit(clientIP);
    // if (!rateLimitCheck.allowed) {
    //   console.log('Rate limit exceeded for IP:', clientIP);
    //   return NextResponse.json(
    //     { 
    //       error: rateLimitCheck.reason || 'Rate limit exceeded',
    //       retryAfter: rateLimitCheck.retryAfter,
    //       remaining: rateLimitCheck.remaining
    //     },
    //     { 
    //       status: 429,
    //       headers: rateLimitCheck.retryAfter 
    //         ? { 'Retry-After': rateLimitCheck.retryAfter.toString() }
    //         : {}
    //     }
    //   );
    // }
    
    // Fake rate limit check for now
    const rateLimitCheck = { allowed: true, remaining: 999 };

    const formData = await request.formData();
    const imageFile = formData.get('image') as string; // base64 data
    const mimeType = formData.get('mimeType') as string;
    
    if (!imageFile || !mimeType) {
      return NextResponse.json(
        { error: 'No image provided' },
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

    // Convert base64 to Gemini part
    const originalImagePart = base64ToPart(imageFile, mimeType);

    // Analyze the photo - this will return default values if parsing fails
    console.log('Analyzing user photo...');
    const userProfile = await analyzeUserPhoto(originalImagePart, apiKey);
    console.log('Analysis complete:', userProfile);
    
    // Note: analyzeUserPhoto always returns a valid profile (defaults to oval/wavy/medium if AI fails)

    // Save to Supabase if configured
    let sessionId: string | undefined;
    if (isSupabaseConfigured()) {
      const { data, error } = await createAnalysisSession(
        userProfile.faceShape,
        userProfile.texture,
        userProfile.density
      );

      if (error) {
        console.error('Failed to save analysis session to database:', error);
        // Continue anyway - database failure shouldn't break the app
      } else if (data) {
        sessionId = data.id;
        console.log('Analysis session saved with ID:', sessionId);
      }

      // TEMPORARILY DISABLED - Increment usage count for this IP
      // await incrementUsageCount(clientIP);
      // console.log('Usage count incremented for IP:', clientIP);
    } else {
      console.log('Supabase not configured - skipping database save');
    }

    return NextResponse.json({ 
      profile: userProfile,
      sessionId: sessionId, // Return session ID for subsequent hairstyle generation
      remaining: rateLimitCheck.remaining // Return remaining usage count
    });
  } catch (error) {
    console.error('Error in analyze-photo API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

