# Hairfit App - Deployment Guide

Complete guide for deploying Hairfit App to production on Vercel.

## Prerequisites

- [x] Supabase project set up (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- [x] Gemini API key from Google AI Studio
- [x] GitHub account (or GitLab/Bitbucket)
- [x] Vercel account (free tier works)

## Step 1: Prepare Your Code

### 1.1 Ensure All Migrations Are Run

In your Supabase dashboard SQL Editor, run all migrations:

```sql
-- Run these in order:
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rate_limiting.sql  
3. supabase/migrations/003_daily_rate_limit_reset.sql
```

### 1.2 Create Environment Variables

Create a `.env.local` file (for local testing):

```bash
cp .env.example .env.local
# Then fill in your actual values
```

### 1.3 Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
- Upload a photo
- Generate hairstyles
- Check rate limiting (try more than 3 uses)

## Step 2: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Production-ready Hairfit App"

# Create GitHub repository (via GitHub website or CLI)
# Then push
git remote add origin https://github.com/YOUR_USERNAME/hairfit-app.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 3.2 Configure Project

**Framework Preset**: Next.js (auto-detected)

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

### 3.3 Add Environment Variables

In Vercel project settings -> Environment Variables, add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `GEMINI_API_KEY` | Your Gemini API key | Production, Preview, Development |
| `SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g., https://hairfit.app) | Production |

**Important**: Select which environments each variable applies to:
- Production: Live site
- Preview: PR previews
- Development: Local development

### 3.4 Deploy

Click "Deploy" and wait 2-3 minutes.

Vercel will:
- Install dependencies
- Run `next build`
- Deploy to global CDN
- Provide you with a URL

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Domain in Vercel

1. Go to Project Settings -> Domains
2. Add your domain (e.g., `hairfit.app`)
3. Follow Vercel's DNS instructions

### 4.2 Update Environment Variable

Update `NEXT_PUBLIC_APP_URL` to your custom domain:

```
NEXT_PUBLIC_APP_URL=https://hairfit.app
```

Redeploy for changes to take effect.

## Step 5: Post-Deployment Verification

### 5.1 Functional Testing

- [ ] Upload a photo
- [ ] Generate hairstyles (all 10)
- [ ] Test rate limiting (3 uses)
- [ ] Test daily reset (wait until midnight)
- [ ] Test HEIC image upload
- [ ] Test error handling (bad image)

### 5.2 Performance Testing

- [ ] Check Lighthouse score (aim for 90+)
- [ ] Test on mobile devices
- [ ] Check loading times
- [ ] Verify images load properly

### 5.3 SEO Verification

```bash
# Test robots.txt
curl https://your-domain.com/robots.txt

# Test sitemap
curl https://your-domain.com/sitemap.xml

# Test Open Graph
# Use https://www.opengraph.xyz/ to verify
```

### 5.4 Security Checklist

- [ ] HTTPS is enforced
- [ ] Security headers are present
- [ ] Rate limiting works
- [ ] DDoS protection active
- [ ] API routes not publicly accessible
- [ ] Environment variables are secret

## Step 6: Monitoring Setup

### 6.1 Vercel Analytics

Already integrated! View in Vercel dashboard:
- Real-time visitors
- Page performance
- Web vitals

### 6.2 Supabase Monitoring

In Supabase dashboard:
- Database usage
- API calls
- Storage usage
- Rate limit hits

### 6.3 Error Tracking (Optional)

See [MONITORING.md](./MONITORING.md) for Sentry setup.

## Scaling for 1000+ Users/Day

### Database Optimization

**Current Limits (Free Tier)**:
- 500 MB database
- 2 GB bandwidth
- 1 GB file storage

**For 1000 users/day**:
- Each session: ~2KB (analysis + metadata)
- Each image: ~500KB (stored in Supabase)
- Daily: ~2MB data + ~500MB storage
- Monthly: ~60MB data + ~15GB storage

**Recommendation**: Start with free tier, upgrade to Supabase Pro ($25/mo) when you hit:
- 100GB bandwidth
- 8GB database
- 100GB storage

### API Rate Limits

**Gemini AI**:
- Free tier: 15 RPM (requests per minute)
- For 1000 users/day with bursts: Consider paid tier

**Current Protection**:
- Rate limiting: 3 uses/day per IP
- DDoS protection: 10 requests/minute per IP

### Vercel Limits

**Hobby (Free)**:
- 100GB bandwidth/month
- Serverless function execution: 100 GB-hours
- Good for starting out

**Pro ($20/mo)**:
- 1TB bandwidth
- 1000 GB-hours execution
- Recommended for 1000+ users/day

## Troubleshooting

### Build Fails

```bash
# Check logs in Vercel dashboard
# Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues
```

### Runtime Errors

1. Check Vercel function logs
2. Check Supabase logs
3. Check browser console
4. Review error.tsx is catching errors

### Performance Issues

1. Enable Vercel Analytics
2. Use Lighthouse in Chrome DevTools
3. Check Supabase query performance
4. Review Gemini API response times

### Rate Limiting Not Working

1. Verify Supabase migrations ran
2. Check SUPABASE_URL and SUPABASE_ANON_KEY
3. Test with different IP addresses
4. Check Supabase table permissions

## Rollback Procedure

If deployment fails:

```bash
# In Vercel dashboard:
1. Go to Deployments
2. Find last working deployment
3. Click "..." -> "Promote to Production"
```

## Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production
- Pull requests → Preview deployments

To disable auto-deploy:
- Project Settings -> Git -> Uncheck "Production Branch"

## Cost Estimation (1000 users/day)

| Service | Free Tier | Estimated Cost (1000 users/day) |
|---------|-----------|-------------------------------|
| Vercel | 100GB bandwidth | $0-20/mo |
| Supabase | 2GB bandwidth | $0-25/mo |
| Gemini AI | 15 RPM | $10-30/mo |
| **Total** | **$0** (free tier) | **$30-75/mo** (paid) |

## Support

- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/docs
- Gemini AI: https://ai.google.dev/docs

---

**Next Steps After Deployment**:
1. Set up custom domain
2. Configure monitoring alerts
3. Add Google Analytics (optional)
4. Submit to search engines
5. Create social media cards

