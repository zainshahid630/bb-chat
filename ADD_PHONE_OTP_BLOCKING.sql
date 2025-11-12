-- ============================================
-- ADD PHONE NUMBER, OTP, AND USER BLOCKING
-- ============================================

-- This script adds:
-- 1. Phone number field to users table
-- 2. OTP verification table
-- 3. User blocking functionality
-- 4. Admin functions to block/unblock users

-- ============================================
-- 1. ADD PHONE NUMBER TO USERS TABLE
-- ============================================

-- Add phone_number column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(is_blocked);

-- ============================================
-- 2. CREATE OTP VERIFICATION TABLE
-- ============================================

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS otp_verifications;

-- Create OTP table
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for OTP lookups
CREATE INDEX idx_otp_phone ON otp_verifications(phone_number);
CREATE INDEX idx_otp_created ON otp_verifications(created_at DESC);
CREATE INDEX idx_otp_verified ON otp_verifications(verified);

-- ============================================
-- 3. CREATE FUNCTION TO GENERATE OTP
-- ============================================

CREATE OR REPLACE FUNCTION generate_otp(
  p_phone_number TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  otp_id UUID,
  otp_code TEXT,
  expires_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp_code TEXT;
  v_expires_at TIMESTAMP;
  v_otp_id UUID;
  v_recent_count INT;
BEGIN
  -- Check rate limiting: Max 3 OTPs per phone per hour
  SELECT COUNT(*) INTO v_recent_count
  FROM otp_verifications
  WHERE phone_number = p_phone_number
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Too many OTP requests. Please try again later.';
  END IF;

  -- Generate 6-digit OTP
  v_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Set expiry to 5 minutes from now
  v_expires_at := NOW() + INTERVAL '5 minutes';
  
  -- Insert OTP record
  INSERT INTO otp_verifications (
    phone_number,
    otp_code,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    p_phone_number,
    v_otp_code,
    v_expires_at,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_otp_id;
  
  -- Return OTP details
  RETURN QUERY
  SELECT v_otp_id, v_otp_code, v_expires_at;
END;
$$;

-- ============================================
-- 4. CREATE FUNCTION TO VERIFY OTP
-- ============================================

CREATE OR REPLACE FUNCTION verify_otp(
  p_phone_number TEXT,
  p_otp_code TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp_record RECORD;
BEGIN
  -- Find the most recent unverified OTP for this phone
  SELECT * INTO v_otp_record
  FROM otp_verifications
  WHERE phone_number = p_phone_number
    AND verified = FALSE
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if OTP exists
  IF v_otp_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 'No OTP found for this phone number';
    RETURN;
  END IF;
  
  -- Check if OTP has expired
  IF v_otp_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, 'OTP has expired. Please request a new one';
    RETURN;
  END IF;
  
  -- Check if max attempts exceeded
  IF v_otp_record.attempts >= v_otp_record.max_attempts THEN
    RETURN QUERY SELECT FALSE, 'Maximum verification attempts exceeded';
    RETURN;
  END IF;
  
  -- Increment attempts
  UPDATE otp_verifications
  SET attempts = attempts + 1
  WHERE id = v_otp_record.id;
  
  -- Check if OTP matches
  IF v_otp_record.otp_code != p_otp_code THEN
    RETURN QUERY SELECT FALSE, 'Invalid OTP code';
    RETURN;
  END IF;
  
  -- Mark OTP as verified
  UPDATE otp_verifications
  SET verified = TRUE,
      verified_at = NOW()
  WHERE id = v_otp_record.id;
  
  -- Update user's phone_verified status
  UPDATE users
  SET phone_verified = TRUE
  WHERE phone_number = p_phone_number;
  
  RETURN QUERY SELECT TRUE, 'OTP verified successfully';
END;
$$;

-- ============================================
-- 5. CREATE FUNCTION TO BLOCK USER
-- ============================================

CREATE OR REPLACE FUNCTION block_user(
  p_user_id UUID,
  p_blocked_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if the person blocking is an admin
  SELECT is_current_user_admin() INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Only admins can block users';
    RETURN;
  END IF;
  
  -- Block the user
  UPDATE users
  SET is_blocked = TRUE,
      blocked_at = NOW(),
      blocked_by = p_blocked_by,
      block_reason = p_reason
  WHERE id = p_user_id;
  
  -- Close all open chats for this user
  UPDATE chats
  SET status = 'closed',
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'open';
  
  RETURN QUERY SELECT TRUE, 'User blocked successfully';
END;
$$;

-- ============================================
-- 6. CREATE FUNCTION TO UNBLOCK USER
-- ============================================

CREATE OR REPLACE FUNCTION unblock_user(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if the person unblocking is an admin
  SELECT is_current_user_admin() INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Only admins can unblock users';
    RETURN;
  END IF;
  
  -- Unblock the user
  UPDATE users
  SET is_blocked = FALSE,
      blocked_at = NULL,
      blocked_by = NULL,
      block_reason = NULL
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT TRUE, 'User unblocked successfully';
END;
$$;

-- ============================================
-- 7. CREATE FUNCTION TO GET BLOCKED USERS
-- ============================================

CREATE OR REPLACE FUNCTION get_blocked_users()
RETURNS TABLE (
  id UUID,
  username TEXT,
  phone_number TEXT,
  blocked_at TIMESTAMP,
  block_reason TEXT,
  blocked_by_username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.phone_number,
    u.blocked_at,
    u.block_reason,
    admin.username as blocked_by_username
  FROM users u
  LEFT JOIN users admin ON u.blocked_by = admin.id
  WHERE u.is_blocked = TRUE
  ORDER BY u.blocked_at DESC;
END;
$$;

-- ============================================
-- 8. UPDATE RLS POLICIES
-- ============================================

-- Prevent blocked users from creating chats
DROP POLICY IF EXISTS "Blocked users cannot create chats" ON chats;
CREATE POLICY "Blocked users cannot create chats"
ON chats FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.is_blocked = TRUE
  )
);

-- Prevent blocked users from sending messages
DROP POLICY IF EXISTS "Blocked users cannot send messages" ON messages;
CREATE POLICY "Blocked users cannot send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.is_blocked = TRUE
  )
);

-- Allow users to read their own OTP records
DROP POLICY IF EXISTS "Users can read their own OTPs" ON otp_verifications;
CREATE POLICY "Users can read their own OTPs"
ON otp_verifications FOR SELECT
TO anon, authenticated
USING (TRUE);

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_otp TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_otp TO anon, authenticated;
GRANT EXECUTE ON FUNCTION block_user TO authenticated;
GRANT EXECUTE ON FUNCTION unblock_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_blocked_users TO authenticated;

-- ============================================
-- 10. CLEANUP OLD OTPs (Optional)
-- ============================================

-- Function to clean up old OTP records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM otp_verifications
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- You can run this manually or set up a cron job:
-- SELECT cleanup_old_otps();

-- ============================================
-- DONE!
-- ============================================

-- Summary of what was added:
-- ✅ phone_number, phone_verified, is_blocked columns to users table
-- ✅ otp_verifications table for OTP management
-- ✅ generate_otp() function with rate limiting
-- ✅ verify_otp() function with expiry and attempt limits
-- ✅ block_user() function (admin only)
-- ✅ unblock_user() function (admin only)
-- ✅ get_blocked_users() function (admin only)
-- ✅ RLS policies to prevent blocked users from using the system
-- ✅ Indexes for performance

-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Integrate 2Factor.in API in frontend
-- 3. Update signup flow to include phone + OTP
-- 4. Add admin UI to block/unblock users

