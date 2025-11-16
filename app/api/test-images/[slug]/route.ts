import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    let filePath: string;
    if (slug === 'og') {
      filePath = join(process.cwd(), 'lib', 'ref_example', 'og.jpg');
    } else if (slug === 'ref') {
      filePath = join(process.cwd(), 'lib', 'ref_example', 'new_ref.jpg');
    } else {
      return NextResponse.json({ error: 'Invalid image' }, { status: 404 });
    }

    const imageBuffer = readFileSync(filePath);
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving test image:', error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}

