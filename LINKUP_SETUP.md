# Linkup API Setup

This document explains how to set up the Linkup API for celebrity hairstyle image search.

## What is Linkup?

[Linkup](https://docs.linkup.so/pages/documentation/get-started/introduction) is a web search engine API designed for AI applications. It provides grounding data to enhance AI output precision and factuality. We use it to search for celebrity hairstyle images dynamically.

## Setup Instructions

### 1. Get Your API Key

1. Visit [Linkup API](https://linkupapi.com/) or [app.linkup.so](https://app.linkup.so)
2. Sign up for a free account (no credit card required)
3. Navigate to your dashboard
4. Copy your API key

### 2. Add to Environment Variables

Add the following to your `.env.local` file:

```bash
LINKUP_API_KEY=your_api_key_here
```

### 3. Test the Integration

The Linkup integration is used in the Celebrity Match tab:

1. Upload a photo in the Celebrity Match tab
2. The system will:
   - Find 5 celebrity matches using Gemini AI
   - Search for 5 hairstyle images per celebrity using Linkup API
   - Display the hairstyle images in a beautiful grid

## API Usage

The integration is implemented in `lib/linkup-search.ts`:

```typescript
import { searchCelebrityHairstyles } from '@/lib/linkup-search';

// Search for a single celebrity
const images = await searchCelebrityHairstyles('Emma Watson', 5);

// Search for multiple celebrities
const imageMap = await searchMultipleCelebrityHairstyles(
  ['Emma Watson', 'Zendaya', 'Timothée Chalamet'],
  5
);
```

## API Endpoint

The Linkup API endpoint used:

```
POST https://api.linkup.so/v1/search
```

Request body:
```json
{
  "q": "celebrity name hairstyles different looks hair styles",
  "depth": "standard",
  "outputType": "searchResults",
  "includeImages": true
}
```

## Features

- ✅ Searches for up to 5 hairstyle images per celebrity
- ✅ Parallel search for multiple celebrities
- ✅ Automatic deduplication of images
- ✅ Graceful error handling (continues without images if API fails)
- ✅ Image validation (broken images are hidden)

## Pricing

- **Free Tier**: Available with no credit card required
- Check [Linkup pricing](https://linkupapi.com/pricing) for details on rate limits

## Troubleshooting

### No images showing up

1. **Check API key**: Verify `LINKUP_API_KEY` is set in `.env.local`
2. **Check logs**: Look in server console for Linkup API errors
3. **Rate limits**: Check if you've exceeded free tier limits
4. **Network**: Ensure your server can reach `api.linkup.so`

### Images not loading

- The UI has automatic error handling - broken images are hidden
- Check browser console for CORS or image loading errors
- Verify the image URLs returned by Linkup are accessible

## Documentation Links

- [Linkup Documentation](https://docs.linkup.so/pages/documentation/get-started/introduction)
- [Linkup API Reference](https://docs.linkup.so/pages/documentation/api-reference)
- [Linkup Playground](https://app.linkup.so/playground) - Test searches directly

## Implementation Details

### Flow

1. User uploads photo in Celebrity Match tab
2. Gemini AI analyzes facial features → Returns 5 celebrity matches
3. For each celebrity, Linkup searches: `"[Celebrity Name] hairstyles different looks"`
4. Returns 5 image URLs per celebrity (25 total)
5. UI displays images in expandable grid per celebrity card

### Files Modified

- `lib/linkup-search.ts` - Core Linkup integration
- `app/api/find-celebrity-matches/route.ts` - API endpoint that calls Linkup
- `app/page.tsx` - UI to display hairstyle images

### Error Handling

The system is designed to be resilient:
- If Linkup API fails, celebrity matches still show (just without images)
- Individual image loading errors are caught and hidden
- Network timeouts are handled gracefully
- Empty results return empty arrays instead of errors

