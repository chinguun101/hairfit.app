# Hairfit App

Intelligent AI-powered web app that analyzes your features and generates personalized hairstyle recommendations using Google's Gemini 2.5 Flash.

## Features

- **Smart Analysis**: AI analyzes your face shape, hair texture, and density
- **Personalized Selection**: Algorithm selects the 10 best hairstyles from 24 professional designs
- **Real-time Generation**: See each hairstyle appear as it's generated
- **Download Results**: Save any hairstyle image to your device
- **Database Storage**: (Optional) Save analysis sessions and generated images to Supabase
- **Rate Limiting**: 3 free uses per user with friendly messaging
- **DDoS Protection**: Request throttling to prevent abuse

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (see ENV_VARIABLES.md)
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Set up Supabase (see SUPABASE_SETUP.md)
# Run migrations in Supabase SQL Editor

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

## Documentation

- 📚 [**Deployment Guide**](./DEPLOYMENT.md) - Complete Vercel deployment instructions
- 🔧 [**Environment Variables**](./ENV_VARIABLES.md) - All environment variable documentation
- 🗄️ [**Supabase Setup**](./SUPABASE_SETUP.md) - Database and storage setup
- 📊 [**Monitoring**](./MONITORING.md) - Monitoring and observability guide
- ✅ [**Production Checklist**](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist

## How It Works

1. **Upload Photo**: Select a photo of yourself
2. **AI Analysis**: Gemini analyzes your:
   - Face shape (oval, round, square, heart, long, diamond)
   - Hair texture (straight, wavy, curly, coily)
   - Hair density (low, medium, high)
3. **Smart Selection**: Algorithm scores all 24 hairstyles based on your profile and picks the top 10
4. **Generation**: Each selected hairstyle is generated one by one with real-time display
5. **Download**: Save your favorite results

## Cost

Approximately $0.43 per photo:
- 1 analysis call (~$0.04)
- 10 image generations (10 × $0.039)

## Hairstyle Library (24 Styles)

The app includes a curated library of 24 professional hairstyles with metadata for intelligent matching:

1. Burgundy Blowout with Curtain Bangs
2. Blonde Voluminous Curly Shag
3. Smokey Gray Sleek Layered Blowout
4. Black Wet-Look Modern Mullet
5. Pastel Pink Soft Straight Lob
6. Natural Black Medium Wolf Cut with Wispy Bangs
7. Burgundy Ultra-Straight Long Cut with Blunt Bangs
8. Jet Black Short Blunt Bob with Straight Bangs
9. Dark Brown Chest-Length Tight Curly Cut
10. Platinum Blunt Middle-Part Bob
11. Black Wavy Shag with Piecey Micro Bangs
12. Burgundy Medium Layered Shag with Curtain Bangs
13. Jet Black Long Straight Cut with Wispy Full Bangs
14. Long Platinum Layers with Soft Face-Framing
15. Chocolate Brown Layered Lob with Curtain Bangs
16. Chestnut C-Shaped Midi Cut with Face-Framing
17. Caramel Balayage Long Waves with Face-Framing
18. Dark Brown Curly Round Cut
19. Jet Black Long Layered Wolf Cut
20. Copper Medium Blunt Cut with Soft Micro Fringe
21. Honey Blonde Face-Framing Long Shag
22. Ash Brown Sleek Long Bob
23. Black High-Volume Curly Taper
24. Pastel Split-Dye Wavy Lob

## Technical Architecture

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **AI Models**: 
  - Gemini 2.5 Flash (text analysis)
  - Gemini 2.5 Flash Image (hairstyle generation)
- **Recommendation System**: Metadata-driven scoring algorithm
- **API**: Server-side API routes to secure API key
- **Database**: Supabase (PostgreSQL) with Row Level Security for anonymous access
- **Storage**: Supabase Storage for generated hairstyle images
- **Rate Limiting**: IP-based usage tracking (3 sessions per user)
- **Security**: DDoS protection with request throttling (10 req/min per IP)

## Database Schema

When Supabase is configured, the app stores:

- **analysis_sessions**: User photo analysis results (face shape, texture, density)
- **generated_hairstyles**: Generated hairstyle images and metadata
- **rate_limits**: Usage tracking per IP address (enforces 3-session limit)
- **ddos_protection**: Request tracking for DDoS prevention (10 req/min limit)
- **Storage bucket**: Public bucket (`hairstyle-images`) for storing generated images

All data is stored anonymously without user authentication. Rate limiting ensures fair usage.

