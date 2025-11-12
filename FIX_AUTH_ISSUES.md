# 🔧 Fix Authentication Issues

## Problems Fixed in Code:
✅ **Email mismatch** - SignUp used `@gmail.com`, SignIn used `@betting.local`
✅ **Now both use** `@bettingapp.local` consistently

## ⚠️ CRITICAL: Disable Email Confirmation in Supabase

Supabase requires email confirmation by default. Since we're using fake emails, you MUST disable this!

### Steps to Fix:

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/qwfvugbubabjxilyutmn

2. **Click "Authentication" in left sidebar**

3. **Click "Providers"**

4. **Scroll down to "Email"**

5. **DISABLE "Confirm email"**
   - Toggle OFF: "Confirm email"
   - This allows users to login immediately without email verification

6. **Click "Save"**

## 🧪 Test After Fixing:

### Test 1: Register New User
```
1. Open http://localhost:5173
2. Click "Register"
3. Username: testuser
4. Password: test123
5. Click Register
6. Should login automatically
```

### Test 2: Login Existing User
```
1. Logout
2. Click "Login"
3. Username: testuser
4. Password: test123
5. Click Login
6. Should work!
```

## 🚨 If Still Getting Errors:

### Error: "Invalid login credentials"
**Cause**: Old accounts created with `@gmail.com` domain
**Fix**: Delete old users and create new ones

#### Delete Old Users:
1. Go to Supabase → Authentication → Users
2. Delete all test users
3. Try registering again

### Error: "Email not confirmed"
**Cause**: Email confirmation still enabled
**Fix**: Follow steps above to disable it

### Error: "User already registered"
**Cause**: Username exists with old email domain
**Fix**: 
```sql
-- Run in Supabase SQL Editor
DELETE FROM auth.users WHERE email LIKE '%@gmail.com';
DELETE FROM users WHERE username = 'testuser';
```

## 📋 Checklist:

- [ ] Disabled "Confirm email" in Supabase Authentication settings
- [ ] Deleted old test users (if any)
- [ ] Restarted dev server: `npm run dev`
- [ ] Tested registration with new username
- [ ] Tested login with same credentials
- [ ] Both work successfully!

## 🔍 Debug Tips:

### Check Browser Console (F12):
- Look for error messages
- Check Network tab for failed requests

### Check Supabase Logs:
1. Go to Supabase → Logs
2. Click "Auth Logs"
3. See what errors are happening

### Common Issues:

**"Username is not valid"**
- This is likely from email validation
- Make sure you disabled email confirmation
- Use simple usernames (letters and numbers only)

**"Password should be at least 6 characters"**
- Supabase requires minimum 6 character passwords
- Use longer passwords

**"User already exists"**
- Username is taken
- Try a different username
- Or delete the old user

## ✅ After Everything Works:

### Create Admin User:

Option 1: Via SQL (Recommended)
```sql
-- First, register as normal user through the app
-- Then run this to make them admin:
UPDATE users SET is_admin = TRUE WHERE username = 'admin';
```

Option 2: Manual
1. Register through app with username: admin
2. Go to Supabase → Table Editor → users
3. Find the admin user
4. Set is_admin = TRUE

## 🎉 Success Indicators:

✅ Can register new users
✅ Can login with username/password
✅ No email confirmation required
✅ Users see department selection
✅ Admin sees admin dashboard

---

**Still having issues?** Share the exact error message and I'll help debug!

