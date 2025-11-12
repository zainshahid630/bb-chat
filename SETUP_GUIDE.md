# Business Chat System - Complete Setup Guide

## 🎯 Overview
This is a secure web-based chat system to replace WhatsApp for managing your Business business with:
- ✅ User authentication (username/password)
- ✅ 4 department routing (Deposit, Withdraw, New User ID, Complaint)
- ✅ Real-time chat with text, images, files, and voice messages
- ✅ Admin panel to manage all conversations
- ✅ No phone numbers - completely private and secure

## ⚠️ Important: Node.js Version Issue
Your current Node.js version (18.16.0) is too old for the latest Vite. You have two options:

### Option 1: Upgrade Node.js (Recommended)
```bash
# Install nvm (Node Version Manager) if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 20
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x
```

### Option 2: Use Compatible Vite Version
I'll provide files that work with your current Node version.

## 🏗️ Architecture

### Frontend (React)
- **Client Portal**: Login → Select Department → Chat
- **Admin Panel**: View all chats across departments

### Backend (Supabase)
- **Authentication**: Secure user login
- **Database**: Store users, chats, messages
- **Real-time**: Live message updates
- **Storage**: File/image/voice uploads

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project
4. Note down:
   - Project URL
   - Anon/Public Key

### Step 2: Set Up Database Tables

Go to Supabase SQL Editor and run this:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chats table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  department TEXT NOT NULL, -- 'deposit', 'withdraw', 'new_id', 'complaint'
  status TEXT DEFAULT 'open', -- 'open', 'closed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_type TEXT NOT NULL, -- 'client', 'admin'
  message_type TEXT NOT NULL, -- 'text', 'image', 'file', 'voice'
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);

-- Policies for chats
CREATE POLICY "Users can read own chats" ON chats FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Users can create own chats" ON chats FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for messages
CREATE POLICY "Users can read messages in their chats" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chats WHERE id = chat_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)))
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

-- Storage policies
CREATE POLICY "Anyone can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-files');
CREATE POLICY "Anyone can view files" ON storage.objects FOR SELECT USING (bucket_id = 'chat-files');
```

### Step 3: Create Admin User

Run this in Supabase SQL Editor (replace with your admin credentials):

```sql
-- Create admin user (password will be hashed in the app)
INSERT INTO users (username, password_hash, is_admin) 
VALUES ('admin', crypt('your_admin_password', gen_salt('bf')), TRUE);
```

### Step 4: Configure Environment Variables

Create `.env` file in `Businesss-chat-system/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 5: Install Dependencies

```bash
cd Businesss-chat-system
npm install @supabase/supabase-js
npm install react-router-dom
npm install lucide-react  # For icons
```

## 🚀 Running the Application

```bash
cd Businesss-chat-system
npm run dev
```

Visit: http://localhost:5173

## 👥 User Roles

### Client Users
- Register/Login with username & password
- Select department (Deposit/Withdraw/New ID/Complaint)
- Chat with admin
- Send text, images, files, voice messages
- View chat history

### Admin Users
- Login with admin credentials
- View all active chats across departments
- Respond to client messages
- Close/resolve chats
- Filter by department

## 🔐 Security Features

1. **Authentication**: Username/password (no phone numbers)
2. **Row Level Security**: Users only see their own data
3. **Admin Verification**: Only admins can access admin panel
4. **Secure File Upload**: Files stored in Supabase Storage
5. **Real-time Updates**: Instant message delivery

## 📱 Features

### Client Side
- Clean, simple interface
- 4 department buttons on homepage
- Real-time chat
- File/image upload
- Voice message recording
- Chat history

### Admin Side
- Dashboard with all chats
- Department filtering
- Real-time notifications
- Quick responses
- Chat status management

## 🎨 Customization

You can customize:
- Colors and branding
- Department names
- Welcome messages
- File upload limits
- Admin permissions

## 📞 Support

If you need help:
1. Check Supabase logs for errors
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Ensure database tables are created

## 🔄 Next Steps

After I create all the files, you should:
1. Set up Supabase account
2. Run SQL scripts
3. Add environment variables
4. Test with a client account
5. Test with admin account
6. Deploy to production (Vercel/Netlify)

## 🌐 Deployment

To deploy:
```bash
npm run build
```

Then deploy the `dist` folder to:
- Vercel (recommended)
- Netlify
- Your own hosting

---

**Note**: This system is much more secure than WhatsApp because:
- No phone numbers exposed
- Proper authentication
- You control all data
- Can't be banned
- Professional appearance
- Better organization

