# Video Generation - Quick Start Guide

## 🚀 Quick Test (5 minutes)

Generate a test video from your example images right now:

```bash
# 1. Navigate to project directory
cd /Users/chinguunganbaatar/hairstyles_trend

# 2. Run the test script
node generate-test-video.mjs

# 3. View the output video
open output/hairfit-slideshow.mp4
```

**Expected Result:**
```
✅ Found 11 images
🎥 Generating video...
✨ Video generated successfully!
   📁 Location: .../output/hairfit-slideshow.mp4
   📊 Size: 2.9 MB
   ⏱️  Time: 4.19 seconds
   🎬 Duration: ~11 seconds
```

## 🎯 What Was Built

### 1. Video Generation Library (`lib/video-generator.ts`)
Core functionality that:
- Converts base64 images to temporary files
- Uses FFmpeg to create TikTok-style vertical videos (1080x1920)
- Concatenates images with 1 second per frame
- Outputs high-quality H.264 MP4 files

### 2. API Endpoint (`app/api/generate-video/route.ts`)
REST API that:
- Accepts images via FormData
- Processes video generation requests
- Returns base64-encoded video data
- Handles errors gracefully

### 3. Frontend Integration (`app/page.tsx`)
UI components:
- **Red Play Button (▶️)** - Generates video from current images
- **Video Modal** - Displays generated video with player
- **Download Button** - Saves video to device
- **Loading State** - Shows spinner during generation

### 4. Test Scripts
- `generate-test-video.mjs` - Standalone Node.js test
- `test-video.js` - Image verification script

## 📹 Using in Your App

### Step 1: Upload Photo & Generate Hairstyles
1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Upload a photo
4. Wait for 10 hairstyles to generate

### Step 2: Generate Video
1. Click the **red play button (▶️)** in the bottom-right corner
2. Wait ~5-10 seconds for video generation
3. Video modal will appear with your slideshow

### Step 3: Download & Share
1. Click "Download Video" button
2. Video saves as `hairfit-slideshow.mp4`
3. Share on TikTok, Instagram Reels, or YouTube Shorts!

## 🎨 Video Specs

```
Format:      MP4 (H.264)
Resolution:  1080 x 1920 (vertical)
Duration:    1 second per image
Frame Rate:  30 FPS
Quality:     High (CRF 18)
File Size:   ~2-3 MB for 11 images
Optimized:   TikTok, Instagram Reels, YouTube Shorts
```

## 🔧 API Usage

```bash
# Generate video from your own images
curl -X POST http://localhost:3000/api/generate-video \
  -F "image_0=@original.jpg" \
  -F "image_1=@hairstyle1.png" \
  -F "image_2=@hairstyle2.png" \
  -F "duration=1" \
  -F "quality=high"
```

## 📦 What's Included

```
✅ fluent-ffmpeg installed
✅ Video generation library created
✅ API endpoint implemented
✅ Frontend UI with play button
✅ Video modal with player
✅ Download functionality
✅ Test scripts ready
✅ Example video generated (2.9 MB)
```

## 🎬 Example Output

Your test video (`output/hairfit-slideshow.mp4`) contains:
1. Original photo (1 second)
2. Hairstyle variation 1 (1 second)
3. Hairstyle variation 2 (1 second)
4. ... (7 more variations)
5. Hairstyle variation 10 (1 second)

**Total: 11 seconds of TikTok-ready content!**

## 🚨 System Requirements

- ✅ FFmpeg installed (already verified at `/opt/homebrew/bin/ffmpeg`)
- ✅ Node.js 18+ (you're using v23.7.0)
- ✅ At least 100MB free disk space for temp files

## 📚 Full Documentation

For detailed technical docs, see: [VIDEO_GENERATION.md](./VIDEO_GENERATION.md)

## 🎉 You're All Set!

Your video generation feature is ready to use. Try it out:

```bash
# Test it now
npm run dev

# Then:
# 1. Upload a photo
# 2. Generate hairstyles
# 3. Click the red play button
# 4. Download your video!
```

---

**Built with:** FFmpeg + fluent-ffmpeg + Next.js + React

