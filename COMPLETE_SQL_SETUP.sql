-- ============================================
-- COMPLETE DATABASE SETUP FOR BusinessS CHAT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create tables
-- ============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own chats" ON chats;
DROP POLICY IF EXISTS "Users can create own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Users can read messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Step 4: Create RLS Policies
-- ============================================

-- Users table policies
CREATE POLICY "Users can read own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Chats table policies
CREATE POLICY "Users can read own chats" 
  ON chats FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can create own chats" 
  ON chats FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chats" 
  ON chats FOR UPDATE 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Messages table policies
CREATE POLICY "Users can read messages in their chats" 
  ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE id = chat_id 
      AND (
        user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND is_admin = TRUE
        )
      )
    )
  );

CREATE POLICY "Users can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Step 5: Create Storage Bucket
-- ============================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Create storage policies
CREATE POLICY "Anyone can upload files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can view files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'chat-files');

CREATE POLICY "Anyone can update files" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'chat-files');

-- Step 6: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_department ON chats(department);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- ============================================
-- VERIFICATION QUERIES
-- Run these to check if everything is set up
-- ============================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages');

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'chat-files';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'messages');

-- ============================================
-- SUCCESS!
-- If no errors, your database is ready!
-- ============================================

