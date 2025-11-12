# 🚨 TROUBLESHOOT YOUR AUTH ISSUES - DO THIS NOW!

## What I Just Fixed:

✅ **Fixed email domain mismatch**
- SignUp was using `@gmail.com`
- SignIn was using `@betting.local`
- **Now both use `@bettingapp.local`**

## 🔥 DO THESE STEPS IN ORDER:

### Step 1: Enable Email Auth & Disable Confirmation (CRITICAL!)

1. Go to: https://supabase.com/dashboard/project/qwfvugbubabjxilyutmn/auth/providers

2. Find "Email" provider

3. **TURN ON** "Enable Email provider" ✅ (toggle should be GREEN)

4. **TURN OFF** "Confirm email" ❌ (toggle should be GRAY)

5. **TURN OFF** "Secure email change" ❌ (toggle should be GRAY)

6. Click **Save**

**Settings should be:**
- Enable Email provider: ✅ ON
- Confirm email: ❌ OFF
- Secure email change: ❌ OFF

**Why?**
- Email provider must be enabled to allow login
- Email confirmation must be disabled (we use fake emails)

---

### Step 2: Clean Up Old Users

Old users were created with wrong email domain. Delete them:

1. Go to: https://supabase.com/dashboard/project/qwfvugbubabjxilyutmn/auth/users

2. **Delete ALL test users** (if any exist)

OR run this SQL:

```sql
-- Go to SQL Editor and run:
DELETE FROM auth.users WHERE email LIKE '%@gmail.com';
DELETE FROM auth.users WHERE email LIKE '%@betting.local';
```

---

### Step 3: Fix Database Schema

**IMPORTANT:** The users table should NOT have a `password_hash` column!

1. Go to: https://supabase.com/dashboard/project/qwfvugbubabjxilyutmn/editor

2. Click on **SQL Editor**

3. Copy the content from `FIX_DATABASE_SCHEMA.sql`

4. Paste and click **"Run"**

This will:
- Drop old tables (with wrong schema)
- Create new tables (without password_hash)
- Set up all policies correctly

**Note:** This will delete any test data, but that's okay since we're just setting up!

---

### Step 4: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

### Step 5: Test Registration

1. Open: http://localhost:5173

2. Click **"Register"**

3. Enter:
   - Username: `testuser` (simple, no special characters)
   - Password: `test123456` (at least 6 characters)
   - Confirm: `test123456`

4. Click **Register**

**Expected**: Should login automatically and show department buttons

**If error**: Check browser console (F12) and tell me the exact error

---

### Step 6: Test Login

1. Logout (if logged in)

2. Click **"Login"**

3. Enter:
   - Username: `testuser`
   - Password: `test123456`

4. Click **Login**

**Expected**: Should login and show department buttons

---

## 🔍 Common Errors & Solutions:

### Error: "Email logins are disabled"

**Cause**: Email provider is turned off in Supabase

**Fix**: Go back to Step 1 and **TURN ON** "Enable Email provider"

---

### Error: "Invalid login credentials"

**Cause**: User doesn't exist or wrong password

**Fix**:
1. Make sure you registered first
2. Use exact same username/password
3. Check for typos

---

### Error: "password_hash violates not-null constraint"

**Cause**: Database table has wrong schema (has password_hash column)

**Fix**: Run the SQL from `FIX_DATABASE_SCHEMA.sql` to recreate tables

---

### Error: "User already registered"

**Cause**: Username exists with old email domain

**Fix**:
```sql
-- Delete specific user:
DELETE FROM auth.users WHERE email = 'testuser@gmail.com';
DELETE FROM users WHERE username = 'testuser';
```

---

### Error: "Email not confirmed"

**Cause**: Email confirmation is still enabled

**Fix**: Go back to Step 1 and disable it!

---

### Error: "Username is not valid"

**Cause**: Supabase is trying to validate the email

**Fix**: 
1. Make sure email confirmation is disabled
2. Use simple usernames (letters and numbers only)
3. No spaces or special characters

---

### Error: "Failed to create chat"

**Cause**: Database tables not set up

**Fix**: Run COMPLETE_SQL_SETUP.sql

---

## 🎯 Quick Checklist:

- [ ] Disabled email confirmation in Supabase
- [ ] Deleted old test users
- [ ] Verified tables exist (users, chats, messages)
- [ ] Restarted dev server
- [ ] Tested registration with new username
- [ ] Tested login with same credentials

---

## 📱 After Everything Works:

### Create Admin Account:

**Method 1: Register then promote**
```sql
-- 1. Register through app with username: admin
-- 2. Then run this SQL:
UPDATE users SET is_admin = TRUE WHERE username = 'admin';
```

**Method 2: Check existing users**
```sql
-- See all users:
SELECT * FROM users;

-- Make any user admin:
UPDATE users SET is_admin = TRUE WHERE username = 'your-username';
```

---

## 🆘 Still Not Working?

### Check These:

1. **Browser Console (F12)**
   - Look for red errors
   - Share the exact error message

2. **Supabase Auth Logs**
   - Go to: https://supabase.com/dashboard/project/qwfvugbubabjxilyutmn/logs/auth-logs
   - See what's failing

3. **Network Tab (F12)**
   - Check if API calls are failing
   - Look for 400/401/500 errors

---

## 📋 What to Tell Me If Still Broken:

1. **Exact error message** from browser console
2. **Screenshot** of the error
3. **Which step** you're stuck on
4. **What you see** in Supabase Auth Logs

---

## ✅ Success Looks Like:

1. ✅ Register new user → Automatically logged in
2. ✅ See 4 department buttons
3. ✅ Click department → Opens chat
4. ✅ Can send messages
5. ✅ Logout and login again → Works!
6. ✅ Admin user sees admin dashboard

---

**Start with Step 1 and work through each step!**

**The most common issue is forgetting to disable email confirmation!**

