# 🔴 FIX: Infinite Recursion in Users Policy

## ❌ **Error:**
```
infinite recursion detected in policy for relation "users"
```

---

## 🔍 **What Caused This:**

**The broken policy:**
```sql
CREATE POLICY "Admins can read all users" 
  ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users          -- ❌ Querying users table
      WHERE id = auth.uid()        -- ❌ From within users policy
      AND is_admin = TRUE          -- ❌ = INFINITE RECURSION!
    )
  );
```

**Why it fails:**
1. Admin tries to read from `users` table
2. Policy checks if user is admin
3. To check, it queries `users` table
4. Which triggers the policy again
5. Which queries `users` table again
6. **→ INFINITE LOOP!** 💥

---

## ✅ **SOLUTION:**

Use a **SECURITY DEFINER** function that bypasses RLS!

### **Step 1: Go to Supabase SQL Editor**
```
https://supabase.com/dashboard/project/qwfvugbubabjxilyutmn/sql/new
```

### **Step 2: Run This SQL**

```sql
-- Create helper function (bypasses RLS, no recursion!)
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

-- Drop old broken policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read users" ON users;

-- Create new policy using the function
CREATE POLICY "Users can read users" 
  ON users FOR SELECT 
  USING (
    auth.uid() = id              -- Users can read themselves
    OR is_current_user_admin()   -- OR current user is admin (no recursion!)
  );
```

### **Step 3: Click "Run"**

### **Step 4: Verify**

```sql
-- Test 1: Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'is_current_user_admin';
-- Should return: is_current_user_admin

-- Test 2: Check if you're admin
SELECT is_current_user_admin();
-- Should return: true (if you're admin)

-- Test 3: Try reading users
SELECT id, username, is_admin FROM users LIMIT 5;
-- Should return users (no error!)
```

---

## 🎯 **How It Works:**

### **Before (BROKEN):**
```
Admin queries users table
  ↓
Policy checks: "Is user admin?"
  ↓
Queries users table to check is_admin
  ↓
Policy checks: "Is user admin?"
  ↓
Queries users table to check is_admin
  ↓
Policy checks: "Is user admin?"
  ↓
∞ INFINITE RECURSION ∞
```

### **After (FIXED):**
```
Admin queries users table
  ↓
Policy checks: is_current_user_admin()
  ↓
Function runs with SECURITY DEFINER (bypasses RLS)
  ↓
Returns TRUE
  ↓
✅ Query succeeds!
```

---

## 🔑 **Key Concept: SECURITY DEFINER**

**What it does:**
- Function runs with the privileges of the function owner (superuser)
- **Bypasses RLS policies**
- No recursion because RLS is not checked inside the function

**Normal function:**
```sql
CREATE FUNCTION check_admin() ...
-- ❌ Still subject to RLS
-- ❌ Will cause recursion
```

**SECURITY DEFINER function:**
```sql
CREATE FUNCTION check_admin() ... SECURITY DEFINER;
-- ✅ Bypasses RLS
-- ✅ No recursion!
```

---

## 🧪 **Testing:**

### **Test 1: Function Works**
```sql
SELECT is_current_user_admin();
```
**Expected:** `true` (if you're admin) or `false` (if not)

### **Test 2: Can Read Users**
```sql
SELECT * FROM users;
```
**Before fix:** `infinite recursion detected`
**After fix:** Returns all users ✅

### **Test 3: Non-Admin Can't Read Others**
1. Login as regular user (not admin)
2. Run: `SELECT * FROM users;`
3. **Expected:** Only sees their own row

### **Test 4: Admin Can Read All**
1. Login as admin
2. Run: `SELECT * FROM users;`
3. **Expected:** Sees all users

---

## 🔍 **Debugging:**

### **If still getting recursion error:**

**Check 1: Function exists**
```sql
SELECT proname FROM pg_proc WHERE proname = 'is_current_user_admin';
```
If empty, re-run the CREATE FUNCTION statement.

**Check 2: Old policies removed**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'users';
```
Should only show: `"Users can read users"`

If you see multiple policies, drop them:
```sql
DROP POLICY IF EXISTS "old_policy_name" ON users;
```

**Check 3: Policy uses function**
```sql
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'users';
```
Should contain: `is_current_user_admin()`

---

## 📊 **Summary:**

| Approach | Result |
|----------|--------|
| Query users in policy | ❌ Infinite recursion |
| Subquery in USING | ❌ Infinite recursion |
| SECURITY DEFINER function | ✅ Works! |

---

## 🚀 **Complete SQL (Copy & Paste):**

```sql
-- Step 1: Create helper function
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

-- Step 2: Drop old policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read users" ON users;

-- Step 3: Create new policy
CREATE POLICY "Users can read users" 
  ON users FOR SELECT 
  USING (
    auth.uid() = id 
    OR is_current_user_admin()
  );

-- Step 4: Verify
SELECT is_current_user_admin();
SELECT * FROM users LIMIT 5;
```

---

## ✅ **After Running This:**

- ✅ No more infinite recursion
- ✅ Admins can read all users
- ✅ Regular users can only read themselves
- ✅ Usernames will show in admin panel
- ✅ No 406 errors

---

**Run the SQL now and the error will be gone!** 🎉

