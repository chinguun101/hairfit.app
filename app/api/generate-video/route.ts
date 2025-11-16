import { NextRequest, NextResponse } from 'next/server';
import { generateSlideshowVideo } from '@/lib/video-generator';

export const maxDuration = 300; // 5 minutes timeout for video generation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract images from form data
    const images: string[] = [];
    let index = 0;
    
    while (true) {
      const image = formData.get(`image_${index}`);
      if (!image) break;
      
      if (typeof image === 'string') {
        images.push(image);
      }
      index++;
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    console.log(`Generating video from ${images.length} images...`);

    // Get optional parameters
    const duration = parseFloat(formData.get('duration') as string || '1');
    const transition = (formData.get('transition') as string || 'fade') as 'fade' | 'slide' | 'none';
    const quality = (formData.get('quality') as string || 'high') as 'low' | 'medium' | 'high';

    // Generate the video
    const result = await generateSlideshowVideo({
      images,
      duration,
      transition,
      quality,
      width: 1080,
      height: 1920, // TikTok vertical format
      fps: 30
    });

    if (!result.success || !result.videoPath) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate video' },
        { status: 500 }
      );
    }

    console.log('Video generated successfully');

    return NextResponse.json({
      success: true,
      video: result.videoPath,
      imageCount: images.length,
      duration: duration * images.length,
      format: 'mp4'
    });

  } catch (error) {
    console.error('Error in generate-video API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

