-- Upgrade Rate Limiting to Daily Reset
-- This allows users to get 3 uses per day instead of 3 uses forever

-- Add reset_date column to track when the count should reset
ALTER TABLE rate_limits ADD COLUMN IF NOT EXISTS reset_date DATE DEFAULT CURRENT_DATE;

-- Create index on reset_date for faster queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_date ON rate_limits(reset_date);

-- Function to reset usage count if date has changed
CREATE OR REPLACE FUNCTION check_and_reset_daily_limit(
  p_ip_address TEXT
) RETURNS TABLE (
  usage_count INTEGER,
  reset_date DATE
) AS $$
DECLARE
  v_record RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get existing record
  SELECT * INTO v_record
  FROM rate_limits
  WHERE ip_address = p_ip_address
  FOR UPDATE;

  -- If record doesn't exist, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::INTEGER, v_today;
    RETURN;
  END IF;

  -- If reset_date is old, reset the counter
  IF v_record.reset_date < v_today THEN
    UPDATE rate_limits
    SET 
      usage_count = 0,
      reset_date = v_today,
      last_used_at = NOW()
    WHERE ip_address = p_ip_address;
    
    RETURN QUERY SELECT 0::INTEGER, v_today;
  ELSE
    -- Return current count
    RETURN QUERY SELECT v_record.usage_count::INTEGER, v_record.reset_date::DATE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update comment
COMMENT ON TABLE rate_limits IS 'Tracks daily usage count per IP address (enforces 3-session limit per day with automatic reset)';
COMMENT ON COLUMN rate_limits.reset_date IS 'Date when the usage count will reset (resets daily)';
COMMENT ON FUNCTION check_and_reset_daily_limit IS 'Checks if daily limit needs reset and returns current usage count';

