# Monitoring & Observability Guide

Complete guide for monitoring Hairfit App in production.

## Overview

Monitor these key areas:
- ✅ Application errors
- ✅ Performance metrics
- ✅ User analytics
- ✅ Database health
- ✅ API usage
- ✅ Rate limiting

## 1. Vercel Analytics (Built-in)

### Access
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Analytics" tab

### Metrics Available
- **Real-time visitors**: Current active users
- **Page views**: Total page visits
- **Top pages**: Most visited pages
- **Referrers**: Traffic sources
- **Devices**: Desktop vs mobile
- **Countries**: Geographic distribution

### Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s good
- **FID** (First Input Delay): < 100ms good
- **CLS** (Cumulative Layout Shift): < 0.1 good
- **FCP** (First Contentful Paint): < 1.8s good
- **TTFB** (Time to First Byte): < 600ms good

### Speed Insights
Built-in! Already integrated via `@vercel/speed-insights`

**View**: Vercel Dashboard → Speed

## 2. Supabase Monitoring

### Database Dashboard
**Access**: Supabase Dashboard → Project → Database

**Monitor**:
- Database size usage
- Connection pool usage
- Active connections
- Slow queries
- Table sizes

**Alerts to Set**:
- Database size > 80% of limit
- Connection pool > 80%

### API Monitoring
**Access**: Supabase Dashboard → Project → API

**Track**:
- Total requests
- Error rate
- Response times
- Bandwidth usage

### Storage Monitor
**Access**: Supabase Dashboard → Storage

**Track**:
- Storage used / limit
- Bandwidth used
- File upload rate
- Failed uploads

### Usage Queries

Run these in SQL Editor to monitor:

```sql
-- Daily usage by IP
SELECT 
  ip_address,
  usage_count,
  reset_date,
  last_used_at
FROM rate_limits
WHERE reset_date = CURRENT_DATE
ORDER BY usage_count DESC
LIMIT 20;

-- Total sessions today
SELECT COUNT(*) as sessions_today
FROM analysis_sessions
WHERE created_at >= CURRENT_DATE;

-- Most popular hairstyles
SELECT 
  hairstyle_id,
  hairstyle_name,
  COUNT(*) as times_generated
FROM generated_hairstyles
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY hairstyle_id, hairstyle_name
ORDER BY times_generated DESC
LIMIT 10;

-- DDoS attempts
SELECT 
  ip_address,
  request_count,
  window_start,
  updated_at
FROM ddos_protection
WHERE request_count > 5
ORDER BY request_count DESC;

-- Storage usage
SELECT 
  COUNT(*) as total_images,
  pg_size_pretty(SUM(LENGTH(image_url))) as estimated_size
FROM generated_hairstyles;
```

## 3. Application Logging

### Server-Side Logs
**Access**: Vercel Dashboard → Deployments → [Select Deployment] → Functions

**View logs for**:
- `/api/analyze-photo`
- `/api/generate-hairstyles`

**Key log patterns**:
```
✅ "Analysis session saved with ID: xxx"
✅ "Successfully generated hairstyle X"
❌ "Rate limit exceeded for IP: xxx"
❌ "Error in rate limit check"
❌ "Hairstyle generation timed out"
```

### Error Patterns to Monitor

**Rate Limiting**:
```
"Rate limit exceeded for IP"
"DDoS protection triggered"
"Daily usage limit exceeded"
```

**API Errors**:
```
"Hairstyle generation timed out"
"Photo analysis timed out"
"Error generating hairstyle"
"API key not configured"
```

**Database Errors**:
```
"Failed to save analysis session"
"Failed to upload image to storage"
"Error checking rate limit"
```

## 4. Performance Monitoring

### Key Metrics to Track

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| API Response Time | < 5s | > 10s | > 20s |
| Image Generation Time | < 8s | > 15s | > 30s |
| Error Rate | < 1% | > 5% | > 10% |
| Success Rate | > 95% | < 90% | < 80% |

### Lighthouse Scores

Run monthly audits:

```bash
# Install lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --view
```

**Target Scores**:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

## 5. Uptime Monitoring

### Recommended Tools

**Option 1: UptimeRobot** (Free)
- Website: https://uptimerobot.com
- Monitor: Main page + API endpoints
- Alerts: Email, SMS, Slack
- Interval: 5 minutes

**Option 2: Better Uptime** (Free/Paid)
- Website: https://betteruptime.com
- Features: Status page, incidents
- Interval: 30 seconds (paid)

### Setup
1. Create account
2. Add monitors:
   - `https://yourdomain.com` (every 5 min)
   - `https://yourdomain.com/api/health` (if you create one)
3. Set alert contacts
4. Create status page (optional)

## 6. Error Tracking with Sentry (Optional)

### Setup

1. **Create Sentry Account**
   - Go to [sentry.io](https://sentry.io)
   - Create new project (Next.js)

2. **Install Sentry**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

3. **Configure**
The wizard will create:
- `sentry.client.config.js`
- `sentry.server.config.js`
- `sentry.edge.config.js`

4. **Add Environment Variable**
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

5. **Test**
```typescript
// Throw test error
throw new Error("Sentry test error");
```

### Sentry Features
- **Error tracking**: Catch all runtime errors
- **Performance monitoring**: Track slow operations
- **Release tracking**: See errors by deployment
- **User feedback**: Collect user error reports

## 7. Custom Health Check Endpoint

Create `/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!process.env.GEMINI_API_KEY,
      supabase: isSupabaseConfigured(),
    }
  };

  const allHealthy = Object.values(checks.services).every(v => v);
  
  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503
  });
}
```

Monitor this endpoint with uptime services.

## 8. Alerts Setup

### Critical Alerts (Immediate)
- Site down (> 5 minutes)
- Error rate > 10%
- Database connection failed
- API key invalid/expired

### Warning Alerts (Next day)
- Slow response times (> 10s)
- Database size > 80%
- Bandwidth > 80%
- Error rate > 5%

### Info Alerts (Weekly digest)
- Usage statistics
- Popular hairstyles
- Top referrers
- Performance trends

## 9. Daily Monitoring Checklist

### Every Morning (5 min)
- [ ] Check Vercel Analytics - any traffic spikes?
- [ ] Check error logs - any new errors?
- [ ] Check Supabase usage - approaching limits?
- [ ] Verify uptime - any downtime overnight?

### Weekly (15 min)
- [ ] Review performance metrics
- [ ] Check storage usage trends
- [ ] Analyze popular hairstyles
- [ ] Review rate limit hits
- [ ] Check slow query logs

### Monthly (30 min)
- [ ] Run Lighthouse audit
- [ ] Review cost projections
- [ ] Analyze user retention
- [ ] Plan optimizations
- [ ] Update dependencies

## 10. Incident Response

### When Errors Spike

1. **Check Vercel logs** - What's failing?
2. **Check Supabase status** - Is database down?
3. **Check Gemini AI status** - API issues?
4. **Review recent deployments** - New bug?
5. **Rollback if needed** - Promote previous deployment

### When Performance Degrades

1. **Check Web Vitals** - Which metric is slow?
2. **Review database queries** - Slow queries?
3. **Check Gemini response times** - API slow?
4. **Monitor concurrent users** - Traffic spike?

### When Rate Limits Hit

```sql
-- Check if legitimate users or attack
SELECT 
  ip_address,
  usage_count,
  COUNT(DISTINCT DATE(last_used_at)) as days_active
FROM rate_limits
GROUP BY ip_address, usage_count
HAVING COUNT(DISTINCT DATE(last_used_at)) < 2
ORDER BY usage_count DESC;
```

## 11. Key Performance Indicators (KPIs)

Track these weekly:

### User Metrics
- Daily active users
- Photos analyzed per day
- Hairstyles generated per day  
- Average session duration
- Return user rate

### Technical Metrics
- Average API response time
- Success rate %
- Error rate %
- Uptime %
- P95 response time

### Business Metrics
- Cost per user
- Conversion rate (if applicable)
- Storage growth rate
- Bandwidth usage

## 12. Dashboard Setup

### Recommended Stack
- **Vercel**: Built-in analytics
- **Supabase**: Database metrics
- **Google Sheets**: Custom KPI tracking
- **UptimeRobot**: Uptime monitoring

### Manual KPI Tracking

Create a Google Sheet with:
```
Date | Users | Photos | Hairstyles | Errors | Cost | Notes
```

Update weekly with SQL queries from Supabase.

## Useful SQL Queries for Reports

```sql
-- Weekly report
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT ip_address) as unique_users,
  COUNT(*) as total_sessions
FROM rate_limits
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Hourly traffic pattern
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as sessions
FROM analysis_sessions
WHERE created_at >= CURRENT_DATE
GROUP BY hour
ORDER BY hour;

-- Success rate
SELECT 
  COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM generated_hairstyles
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/dashboard/support
- **Gemini AI**: https://ai.google.dev/docs

---

**Remember**: Good monitoring prevents fires. Check dashboards daily!

