-- Create disclaimers table
CREATE TABLE IF NOT EXISTS disclaimers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE disclaimers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active disclaimers (for login screen)
CREATE POLICY "Anyone can read active disclaimers"
ON disclaimers
FOR SELECT
USING (is_active = true);

-- Policy: Admins can read all disclaimers
CREATE POLICY "Admins can read all disclaimers"
ON disclaimers
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Policy: Admins can insert disclaimers
CREATE POLICY "Admins can insert disclaimers"
ON disclaimers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Policy: Admins can update disclaimers
CREATE POLICY "Admins can update disclaimers"
ON disclaimers
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Policy: Admins can delete disclaimers
CREATE POLICY "Admins can delete disclaimers"
ON disclaimers
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_disclaimers_is_active ON disclaimers(is_active);
CREATE INDEX IF NOT EXISTS idx_disclaimers_created_at ON disclaimers(created_at DESC);

-- Add comment
COMMENT ON TABLE disclaimers IS 'Stores disclaimer/announcement messages that scroll on the login screen';
