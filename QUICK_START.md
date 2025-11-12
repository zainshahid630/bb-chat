# ⚡ Quick Start Guide

Get your Businesss chat system running in 10 minutes!

## Step 1: Upgrade Node.js (2 minutes)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen your terminal, then:
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
```

## Step 2: Install Dependencies (1 minute)

```bash
cd Businesss-chat-system
npm install @supabase/supabase-js
```

## Step 3: Create Supabase Account (3 minutes)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Click "New Project"
5. Fill in:
   - Name: `Business-chat`
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
6. Click "Create new project"
7. Wait ~2 minutes for setup

## Step 4: Get Supabase Credentials (1 minute)

1. In your Supabase project, click "Settings" (gear icon)
2. Click "API" in the left sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string)

## Step 5: Configure Environment (1 minute)

```bash
# In Businesss-chat-system folder
cp .env.example .env

# Edit .env file (use nano, vim, or any text editor)
nano .env
```

Paste your values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Save and exit (Ctrl+X, then Y, then Enter in nano)

## Step 6: Set Up Database (2 minutes)

1. In Supabase, click "SQL Editor" in left sidebar
2. Click "New Query"
3. Copy this SQL and paste it:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create chats table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  department TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_type TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can read own chats" ON chats FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Users can create own chats" ON chats FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read messages in their chats" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM chats WHERE id = chat_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE))));
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);
CREATE POLICY "Anyone can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-files');
CREATE POLICY "Anyone can view files" ON storage.objects FOR SELECT USING (bucket_id = 'chat-files');
```

4. Click "Run" (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

## Step 7: Create Admin User (1 minute)

In the same SQL Editor, run this (replace with your desired admin credentials):

```sql
INSERT INTO users (username, is_admin) 
VALUES ('admin', TRUE);
```

**Remember**: Username is `admin` - you'll set the password when you first login!

## Step 8: Run the App! (30 seconds)

```bash
npm run dev
```

Open your browser to: **http://localhost:5173**

## 🎉 You're Done!

### Test It Out:

1. **Register a client account**:
   - Click "Register"
   - Username: `testuser`
   - Password: `test123`
   - Click Register

2. **Send a test message**:
   - Click "Deposit" button
   - Type a message
   - Click Send

3. **Test admin panel**:
   - Logout
   - Login as admin
   - You should see the client's chat
   - Reply to the message

## 🚨 Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created `.env` file
- Check that values don't have quotes
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Failed to create chat"
- Make sure you ran ALL the SQL scripts
- Check for errors in Supabase SQL Editor
- Verify tables were created (check "Table Editor" in Supabase)

### Dev server won't start
- Make sure Node.js is version 20+: `node --version`
- Delete `node_modules`: `rm -rf node_modules`
- Reinstall: `npm install`

### Can't login as admin
- The admin user is created without a password
- You need to register through the app first
- Or update the SQL to include a password hash

## 📱 Next Steps

1. **Customize the look**: Edit CSS files in `src/components/`
2. **Add more departments**: Edit `DepartmentSelect.jsx`
3. **Deploy to production**: See SETUP_GUIDE.md
4. **Share with clients**: Give them the URL and they can register

## 🔐 Security Tips

- Use strong passwords for admin accounts
- Enable 2FA on your Supabase account
- Regularly backup your database
- Monitor usage in Supabase dashboard

## 📞 Need More Help?

- Check **SETUP_GUIDE.md** for detailed explanations
- Check **INSTALLATION.md** for troubleshooting
- Review Supabase logs for errors
- Check browser console (F12) for frontend errors

---

**Congratulations!** You now have a professional chat system that's way better than WhatsApp! 🎉

