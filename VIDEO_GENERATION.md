# Video Generation Feature

## Overview

The hairfit app now supports generating TikTok-style slideshow videos from the original photo + 10 generated hairstyle images. Videos are created in vertical format (1080x1920) optimized for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.

## Features

✅ **Automatic Video Assembly** - Combines all images into a seamless video  
✅ **TikTok Vertical Format** - 1080x1920 resolution optimized for mobile  
✅ **High Quality Output** - H.264 encoding with CRF 18 for excellent quality  
✅ **Fast Processing** - Generates ~11 second video in ~4 seconds  
✅ **Smart Scaling** - Automatically fits all images to the same aspect ratio  
✅ **Browser Integration** - Video player and download functionality built-in  

## How It Works

### Architecture

1. **Frontend (React)** - User clicks "Generate Video" button
2. **API Route** - `/api/generate-video` receives images and parameters
3. **Video Generator** - `lib/video-generator.ts` uses fluent-ffmpeg
4. **FFmpeg** - Processes images and creates MP4 file
5. **Response** - Returns base64-encoded video to display/download

### Technical Details

**Input:**
- 1 original image + 10 generated hairstyle images (11 total)
- Each image is passed as base64 data URL
- Duration: 1 second per image (configurable)

**Processing:**
1. Convert base64 images to temporary PNG files
2. Scale all images to 1080x1920 (letterboxing if needed)
3. Concatenate frames at 30 FPS
4. Encode with H.264 codec
5. Return base64-encoded video

**Output:**
- Format: MP4 (H.264 video, no audio)
- Resolution: 1080x1920 (vertical)
- Duration: ~11 seconds (1s per image)
- File Size: ~2-3 MB
- Frame Rate: 30 FPS
- Quality: CRF 18 (high quality)

## Usage

### In the App

1. Upload a photo and generate hairstyles
2. Once generation is complete, click the red **play button (▶️)** on the right sidebar
3. Video will be generated and displayed in a modal
4. Click "Download Video" to save the MP4 file

### Via API

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -F "image_0=data:image/jpeg;base64,/9j/4AAQ..." \
  -F "image_1=data:image/png;base64,iVBORw0KGg..." \
  -F "duration=1" \
  -F "quality=high"
```

**Parameters:**
- `image_0` to `image_N`: Base64 data URLs of images
- `duration`: Seconds per image (default: 1)
- `quality`: `low`, `medium`, or `high` (default: `high`)
- `transition`: Currently only `none` supported (concat mode)

**Response:**
```json
{
  "success": true,
  "video": "data:video/mp4;base64,AAAAIGZ0eXBpc29t...",
  "imageCount": 11,
  "duration": 11,
  "format": "mp4"
}
```

### Testing with Example Images

We've provided a test script that generates a video from the example images:

```bash
# Generate test video from example images
node generate-test-video.mjs

# Output will be saved to:
# ./output/hairfit-slideshow.mp4
```

This will:
- ✅ Verify all 11 images exist
- ✅ Generate a 1080x1920 MP4 video
- ✅ Show progress bar during encoding
- ✅ Display file size and generation time

## Video Specifications

| Property | Value |
|----------|-------|
| Container | MP4 |
| Codec | H.264 (libx264) |
| Resolution | 1080 x 1920 |
| Aspect Ratio | 9:16 (vertical) |
| Frame Rate | 30 FPS |
| Quality | CRF 18 (high) |
| Preset | Medium (balanced speed/quality) |
| Pixel Format | yuv420p (maximum compatibility) |
| Audio | None |
| Faststart | Enabled (web streaming) |

## Dependencies

```json
{
  "fluent-ffmpeg": "^2.1.3",
  "@types/fluent-ffmpeg": "^2.1.24"
}
```

**System Requirements:**
- FFmpeg must be installed on the server
- Check installation: `which ffmpeg`
- Install on Mac: `brew install ffmpeg`
- Install on Ubuntu: `apt-get install ffmpeg`

## Performance

| Metric | Value |
|--------|-------|
| Input Images | 11 images (1 original + 10 generated) |
| Processing Time | ~4 seconds |
| Output Size | ~2.9 MB |
| Video Duration | ~11 seconds |
| Peak Memory | ~50 MB |

## File Structure

```
lib/
  video-generator.ts      # Core video generation logic
app/
  api/
    generate-video/
      route.ts            # API endpoint
  page.tsx                # Frontend with video button
generate-test-video.mjs   # Standalone test script
output/
  hairfit-slideshow.mp4   # Generated test video
```

## Code Examples

### Generate Video (TypeScript)

```typescript
import { generateSlideshowVideo } from '@/lib/video-generator';

const result = await generateSlideshowVideo({
  images: [
    'data:image/jpeg;base64,...',
    'data:image/png;base64,...',
    // ... more images
  ],
  duration: 1,        // seconds per image
  quality: 'high',    // low, medium, high
  width: 1080,
  height: 1920,
  fps: 30
});

if (result.success && result.videoPath) {
  console.log('Video generated:', result.videoPath);
  // videoPath is a base64 data URL
}
```

### Frontend Integration

```typescript
// Generate video from current images
const generateVideo = async () => {
  const formData = new FormData();
  
  allImages.forEach((img, index) => {
    formData.append(`image_${index}`, img.image);
  });
  
  formData.append('duration', '1');
  formData.append('quality', 'high');
  
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  if (result.success) {
    setGeneratedVideo(result.video);
  }
};
```

## Troubleshooting

### FFmpeg Not Found
```
Error: Cannot find ffmpeg
```
**Solution:** Install FFmpeg
```bash
# Mac
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
```

### Memory Issues
```
Error: JavaScript heap out of memory
```
**Solution:** Increase Node.js memory limit
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### Timeout Errors
```
Error: Timeout generating video
```
**Solution:** Increase timeout in `app/api/generate-video/route.ts`
```typescript
export const maxDuration = 300; // 5 minutes
```

## Future Enhancements

- [ ] Add background music support
- [ ] Implement fade transitions (xfade filter)
- [ ] Add text overlays ("Hairfit #1", "Hairfit #2", etc.)
- [ ] Support custom durations per image
- [ ] Add zoom/pan effects (Ken Burns effect)
- [ ] Generate square videos for Instagram
- [ ] Batch video generation for multiple sessions
- [ ] Video preview before generation
- [ ] Custom watermark/branding

## API Rate Limiting

Video generation is resource-intensive. Consider implementing rate limiting:

```typescript
// Example: Limit to 10 videos per user per day
const videoLimit = await checkVideoGenerationLimit(userId);
if (videoLimit.exceeded) {
  return NextResponse.json(
    { error: 'Video generation limit exceeded' },
    { status: 429 }
  );
}
```

## Production Deployment

### Vercel

⚠️ **Important:** Vercel's serverless functions have limitations:
- Max execution time: 10 seconds (Hobby), 60 seconds (Pro)
- FFmpeg may not be available in all regions

**Recommended:** Use a dedicated video processing service or worker:
- AWS Lambda with FFmpeg layer
- Google Cloud Functions
- Dedicated video processing server

### Docker Deployment

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## License

This feature uses FFmpeg under the LGPL license. See [FFmpeg License](https://ffmpeg.org/legal.html) for details.

---

**Need Help?** Check the [main README](./README.md) or open an issue on GitHub.

