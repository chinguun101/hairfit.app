import { supabase, isSupabaseConfigured } from './supabase';

// Rate limiting constants
const MAX_USAGE_COUNT = 3; // Maximum number of sessions allowed per IP
const DDOS_WINDOW_MINUTES = 1; // DDoS protection window in minutes
const DDOS_MAX_REQUESTS = 10; // Maximum requests per window per IP

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
  error?: string;
}

export interface DDoSCheckResult {
  allowed: boolean;
  retryAfter?: number; // seconds
  error?: string;
}

/**
 * Get the client IP address from the request
 * Works with Vercel, Cloudflare, and standard deployments
 */
export function getClientIP(request: Request): string {
  // Try various headers in order of preference
  const headers = request.headers;
  
  // Vercel
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Standard
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback (should rarely happen in production)
  return 'unknown';
}

/**
 * Check if IP has exceeded usage limit (3 sessions per day with daily reset)
 * Returns whether the request is allowed and how many uses remain
 */
export async function checkUsageLimit(ipAddress: string): Promise<RateLimitResult> {
  if (!isSupabaseConfigured()) {
    // If Supabase is not configured, allow all requests
    console.warn('Rate limiting disabled: Supabase not configured');
    return { allowed: true, remaining: MAX_USAGE_COUNT };
  }

  try {
    // Use the database function to check and potentially reset daily limit
    const { data, error } = await supabase.rpc('check_and_reset_daily_limit', {
      p_ip_address: ipAddress
    });

    if (error) {
      console.error('Error checking daily rate limit:', error);
      return { 
        allowed: true, 
        remaining: MAX_USAGE_COUNT,
        error: 'Database error'
      };
    }

    // data is an array with one row, or empty if new user
    const currentCount = data && data.length > 0 ? data[0].usage_count : 0;
    const resetDate = data && data.length > 0 ? data[0].reset_date : new Date().toISOString().split('T')[0];

    // Check if limit exceeded
    if (currentCount >= MAX_USAGE_COUNT) {
      // Calculate reset time (midnight tonight)
      const today = new Date(resetDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: tomorrow,
        error: 'Daily usage limit exceeded. Resets at midnight.'
      };
    }

    return {
      allowed: true,
      remaining: MAX_USAGE_COUNT - currentCount - 1
    };
  } catch (error) {
    console.error('Error in rate limit check:', error);
    // On error, allow request (fail open)
    return { 
      allowed: true, 
      remaining: MAX_USAGE_COUNT,
      error: 'System error'
    };
  }
}

/**
 * Increment usage count for an IP address (with daily reset support)
 */
export async function incrementUsageCount(ipAddress: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to get existing record
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .single();

    if (existing) {
      // Check if we need to reset for new day
      const existingDate = existing.reset_date || existing.created_at?.split('T')[0];
      const shouldReset = existingDate < today;
      
      // Update existing record
      await supabase
        .from('rate_limits')
        .update({
          usage_count: shouldReset ? 1 : existing.usage_count + 1,
          reset_date: today,
          last_used_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress);
    } else {
      // Create new record
      await supabase
        .from('rate_limits')
        .insert({
          ip_address: ipAddress,
          usage_count: 1,
          reset_date: today,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error incrementing usage count:', error);
  }
}

/**
 * DDoS protection - check if IP is making too many requests
 * Implements a sliding window rate limiter
 */
export async function checkDDoSProtection(ipAddress: string): Promise<DDoSCheckResult> {
  if (!isSupabaseConfigured()) {
    return { allowed: true };
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - DDOS_WINDOW_MINUTES * 60 * 1000);

    // Get existing record for this IP
    const { data: existing, error: selectError } = await supabase
      .from('ddos_protection')
      .select('*')
      .eq('ip_address', ipAddress)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking DDoS protection:', selectError);
      return { allowed: true };
    }

    if (!existing) {
      // First request from this IP - create record
      await supabase
        .from('ddos_protection')
        .insert({
          ip_address: ipAddress,
          request_count: 1,
          window_start: now.toISOString(),
          updated_at: now.toISOString()
        });
      
      return { allowed: true };
    }

    const existingWindowStart = new Date(existing.window_start);
    
    // Check if window has expired
    if (existingWindowStart < windowStart) {
      // Reset the window
      await supabase
        .from('ddos_protection')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('ip_address', ipAddress);
      
      return { allowed: true };
    }

    // Check if limit exceeded
    if (existing.request_count >= DDOS_MAX_REQUESTS) {
      const resetAt = new Date(existingWindowStart.getTime() + DDOS_WINDOW_MINUTES * 60 * 1000);
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
      
      return {
        allowed: false,
        retryAfter,
        error: 'Too many requests'
      };
    }

    // Increment counter
    await supabase
      .from('ddos_protection')
      .update({
        request_count: existing.request_count + 1,
        updated_at: now.toISOString()
      })
      .eq('ip_address', ipAddress);

    return { allowed: true };
  } catch (error) {
    console.error('Error in DDoS protection check:', error);
    // Fail open on error
    return { allowed: true };
  }
}

/**
 * Combined rate limit check - checks both usage limit and DDoS protection
 */
export async function checkRateLimit(ipAddress: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
  retryAfter?: number;
}> {
  // Check DDoS protection first (more frequent attacks)
  const ddosCheck = await checkDDoSProtection(ipAddress);
  if (!ddosCheck.allowed) {
    return {
      allowed: false,
      reason: 'Too many requests. Please try again in a moment.',
      retryAfter: ddosCheck.retryAfter
    };
  }

  // Check usage limit
  const usageCheck = await checkUsageLimit(ipAddress);
  if (!usageCheck.allowed) {
    return {
      allowed: false,
      reason: 'You have reached your daily limit (3 uses per day). Resets at midnight!',
      remaining: 0
    };
  }

  return {
    allowed: true,
    remaining: usageCheck.remaining
  };
}

