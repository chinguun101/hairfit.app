# Environment Variables Documentation

Complete guide to all environment variables used in Hairfit App.

## Required Variables

### `GEMINI_API_KEY`
- **Required**: Yes
- **Description**: Google Gemini AI API key for hairstyle generation and photo analysis
- **Where to get**: https://makersuite.google.com/app/apikey
- **Format**: String (starts with `AIza...`)
- **Used in**: All API routes
- **Example**: `AIzaSyC...` (keep secret!)

### `SUPABASE_URL`
- **Required**: Yes  
- **Description**: Your Supabase project URL
- **Where to get**: Supabase Dashboard → Project Settings → API
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`
- **Used in**: Database and storage operations
- **Example**: `https://abcdefghijklmnop.supabase.co`

### `SUPABASE_ANON_KEY`
- **Required**: Yes
- **Description**: Supabase anonymous/public API key
- **Where to get**: Supabase Dashboard → Project Settings → API → anon/public
- **Format**: Long JWT token (starts with `eyJ...`)
- **Used in**: Client-side and server-side database calls
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

### `LINKUP_API_KEY`
- **Required**: Yes (for Celebrity Match feature)
- **Description**: Linkup API key for celebrity hairstyle image search
- **Where to get**: https://linkupapi.com/ or https://app.linkup.so
- **Format**: String API key
- **Used in**: Celebrity Match tab to search for hairstyle images
- **Example**: `linkup_xxxxxxxxxxxxx` (keep secret!)
- **Docs**: https://docs.linkup.so/pages/documentation/get-started/introduction

### `FREEPIK_API_KEY`
- **Required**: Yes (for Freepik Gemini integration)
- **Description**: Freepik API key for image generation using Gemini 2.5 Flash
- **Where to get**: https://docs.freepik.com/introduction (includes $5 free credits)
- **Format**: String API key
- **Used in**: Alternative image generation endpoint for testing and model comparison
- **Example**: `fpk_xxxxxxxxxxxxx` (keep secret!)
- **Docs**: https://docs.freepik.com/api-reference/text-to-image/google/post-gemini-2-5-flash-image-preview

## Optional Variables

### `NEXT_PUBLIC_APP_URL`
- **Required**: No (but recommended for production)
- **Description**: Your production app URL for SEO and metadata
- **Default**: `https://hairfit.app`
- **Format**: Full URL with protocol
- **Used in**: SEO metadata, Open Graph tags, sitemaps
- **Example**: `https://hairfit.app` or `https://yourdomain.com`

### `NODE_ENV`
- **Required**: No (automatically set)
- **Description**: Node environment
- **Values**: `development`, `production`, `test`
- **Set by**: Vercel automatically sets this
- **Used in**: Error boundaries, logging

## Optional - Future Enhancements

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Required**: No
- **Description**: Google Analytics 4 Measurement ID
- **Format**: `G-XXXXXXXXXX`
- **Where to get**: Google Analytics → Admin → Data Streams
- **Example**: `G-ABC123DEF4`

### `NEXT_PUBLIC_SENTRY_DSN`
- **Required**: No
- **Description**: Sentry DSN for error tracking
- **Where to get**: Sentry.io → Project Settings → Client Keys
- **Format**: `https://xxx@xxx.ingest.sentry.io/xxx`

## Setting Up Environment Variables

### Local Development

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Fill in your values in `.env.local`

3. Restart your dev server:
```bash
npm run dev
```

### Vercel Production

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with appropriate scopes:
   - Production
   - Preview
   - Development

### Environment Scopes

- **Production**: Live site at your main domain
- **Preview**: Preview deployments for pull requests  
- **Development**: Local development via `vercel dev`

## Security Best Practices

### DO:
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use `NEXT_PUBLIC_*` prefix for client-side variables
- ✅ Store secrets in Vercel dashboard
- ✅ Rotate keys if compromised
- ✅ Use different keys for development/production

### DON'T:
- ❌ Commit `.env.local` to git
- ❌ Share API keys publicly
- ❌ Use production keys in development
- ❌ Hard-code secrets in code
- ❌ Expose server-side keys to client

## Troubleshooting

### "API key not configured"
**Problem**: Missing `GEMINI_API_KEY`
**Solution**: Add the key to `.env.local` or Vercel environment variables

### "Supabase credentials not configured"
**Problem**: Missing `SUPABASE_URL` or `SUPABASE_ANON_KEY`
**Solution**: Add both variables, restart server

### Changes not taking effect
**Problem**: Environment variables cached
**Solution**: 
- Local: Restart `npm run dev`
- Vercel: Trigger new deployment

### Build fails on Vercel
**Problem**: Missing required environment variables
**Solution**: Add all required vars in Vercel dashboard → Environment Variables

## Verification

Test your environment setup:

```bash
# Local development
echo $GEMINI_API_KEY
echo $SUPABASE_URL

# Check if variables are loaded in your app
# Should see values in console (server-side only)
```

## Environment Variable Checklist

Before deploying:

- [ ] `GEMINI_API_KEY` - Added and tested
- [ ] `SUPABASE_URL` - Added and tested
- [ ] `SUPABASE_ANON_KEY` - Added and tested
- [ ] `LINKUP_API_KEY` - Added and tested (for Celebrity Match)
- [ ] `FREEPIK_API_KEY` - Added and tested (for Freepik Gemini integration)
- [ ] `NEXT_PUBLIC_APP_URL` - Set to production domain
- [ ] All migrations run in Supabase
- [ ] Local testing passed
- [ ] Vercel variables configured
- [ ] `.env.local` in `.gitignore`

## Quick Reference

| Variable | Prefix | Required | Where Used | Client-Safe |
|----------|--------|----------|------------|-------------|
| GEMINI_API_KEY | - | Yes | Server | No |
| SUPABASE_URL | - | Yes | Both | Yes |
| SUPABASE_ANON_KEY | - | Yes | Both | Yes |
| LINKUP_API_KEY | - | Yes* | Server | No |
| FREEPIK_API_KEY | - | Yes* | Server | No |
| NEXT_PUBLIC_APP_URL | NEXT_PUBLIC_ | No | Both | Yes |
| NODE_ENV | - | Auto | Both | Yes |

\* LINKUP_API_KEY required only for Celebrity Match feature
\* FREEPIK_API_KEY required only for Freepik Gemini integration

**Note**: Variables without `NEXT_PUBLIC_` prefix are only available on the server side.

