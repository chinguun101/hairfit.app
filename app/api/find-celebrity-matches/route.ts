import { NextRequest, NextResponse } from 'next/server';
import { base64ToPart, findCelebrityMatches } from '@/lib/gemini';
import { getClientIP, checkRateLimit } from '@/lib/rate-limit';
import { searchMultipleCelebrityHairstyles } from '@/lib/linkup-search';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = getClientIP(request);
    console.log('Celebrity match request from IP:', clientIP);

    // TEMPORARILY DISABLED - Check rate limits
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
    const imagePart = base64ToPart(imageFile, mimeType);

    // Find celebrity matches
    console.log('Finding celebrity matches...');
    const celebrities = await findCelebrityMatches(imagePart, apiKey);
    
    if (celebrities.length === 0) {
      return NextResponse.json(
        { error: 'No celebrity matches found' },
        { status: 404 }
      );
    }

    console.log('Celebrity matches found:', celebrities.length);

    // Search for hairstyle images for each celebrity
    console.log('Searching for hairstyle images using Linkup API...');
    const celebrityNames = celebrities.map(c => c.name);
    
    let hairstyleImagesMap: Map<string, any[]> = new Map();
    
    try {
      hairstyleImagesMap = await searchMultipleCelebrityHairstyles(celebrityNames, 5);
      console.log('Hairstyle images fetched successfully');
    } catch (error) {
      console.error('Error fetching hairstyle images from Linkup:', error);
      // Continue without images if Linkup fails
      // Set empty arrays for all celebrities
      celebrityNames.forEach(name => hairstyleImagesMap.set(name, []));
    }

    // Combine celebrity matches with their hairstyle images
    const matchesWithImages = celebrities.map(celebrity => ({
      ...celebrity,
      hairstyleImages: hairstyleImagesMap.get(celebrity.name) || []
    }));

    return NextResponse.json({ 
      matches: matchesWithImages,
      remaining: rateLimitCheck.remaining
    });
  } catch (error) {
    console.error('Error in find-celebrity-matches API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

