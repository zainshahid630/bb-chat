-- ============================================
-- FIX: Users Table RLS Policy
-- Allow admins to read all usernames
-- ============================================

-- Problem: Admin can't fetch usernames from users table
-- Error: 406 Not Acceptable when querying users table

-- Solution: Add RLS policy to allow admins to read all users

-- Step 1: Check current policies
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';

-- Step 2: Drop old restrictive policy (if exists)
-- ============================================

DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Step 3: Create helper function (no recursion)
-- ============================================

-- Create a function to check if current user is admin
-- This function bypasses RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create new policy using the function
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read users" ON users;

-- Create single policy that works for both users and admins
CREATE POLICY "Users can read users"
  ON users FOR SELECT
  USING (
    auth.uid() = id              -- Users can read themselves
    OR is_current_user_admin()   -- OR current user is admin (no recursion!)
  );

-- Step 5: Verify function and policy
-- ============================================

-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'is_current_user_admin';
-- Should return: is_current_user_admin

-- Check policy
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
AND cmd = 'SELECT';
-- Should show: "Users can read users"

-- Step 6: Test the query
-- ============================================

-- Test if you're admin
SELECT is_current_user_admin();
-- Should return: true (if you're admin)

-- Test reading all users (as admin)
SELECT id, username, is_admin
FROM users
LIMIT 5;
-- Should return all users (no 406 error!)

-- ============================================
-- SUCCESS! Admins can now read all usernames!
-- No infinite recursion!
-- ============================================

