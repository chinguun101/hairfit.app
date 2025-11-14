-- Rate Limiting and DDoS Protection
-- Track usage by IP address to limit to 3 sessions per user

-- ============================================================================
-- TABLE: rate_limits
-- Stores usage tracking per IP address
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast IP lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_address);

-- Index for cleanup queries (optional, for future maintenance)
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_used ON rate_limits(last_used_at DESC);

-- ============================================================================
-- TABLE: ddos_protection
-- Track requests per IP for DDoS protection (sliding window)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ddos_protection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast IP lookup in current time window
CREATE UNIQUE INDEX IF NOT EXISTS idx_ddos_protection_ip ON ddos_protection(ip_address);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable anonymous access for rate limiting checks
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddos_protection ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to SELECT from rate_limits
CREATE POLICY "Allow anonymous select on rate_limits"
  ON rate_limits
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to INSERT into rate_limits
CREATE POLICY "Allow anonymous insert on rate_limits"
  ON rate_limits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to UPDATE rate_limits
CREATE POLICY "Allow anonymous update on rate_limits"
  ON rate_limits
  FOR UPDATE
  TO anon
  USING (true);

-- Allow anonymous users to SELECT from ddos_protection
CREATE POLICY "Allow anonymous select on ddos_protection"
  ON ddos_protection
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to INSERT into ddos_protection
CREATE POLICY "Allow anonymous insert on ddos_protection"
  ON ddos_protection
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to UPDATE ddos_protection
CREATE POLICY "Allow anonymous update on ddos_protection"
  ON ddos_protection
  FOR UPDATE
  TO anon
  USING (true);

-- Allow anonymous users to DELETE from ddos_protection (for cleanup)
CREATE POLICY "Allow anonymous delete on ddos_protection"
  ON ddos_protection
  FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- HELPER FUNCTION: Cleanup old DDoS protection records
-- Run this periodically to remove expired time windows
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_ddos_records()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM ddos_protection
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE rate_limits IS 'Tracks total usage count per IP address for enforcing 3-session limit';
COMMENT ON TABLE ddos_protection IS 'Tracks requests per minute per IP for DDoS protection (sliding window)';
COMMENT ON COLUMN rate_limits.usage_count IS 'Number of times this IP has used the service (max 3)';
COMMENT ON COLUMN ddos_protection.request_count IS 'Number of requests in current time window';
COMMENT ON COLUMN ddos_protection.window_start IS 'Start of the current rate limiting window';

