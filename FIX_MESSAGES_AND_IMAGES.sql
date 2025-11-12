-- ============================================
-- FIX MESSAGES AND IMAGES
-- 1. Ensure storage bucket exists
-- 2. Set proper permissions
-- 3. Verify message structure
-- ============================================

-- Step 1: Create storage bucket for chat files (if not exists)
-- ============================================
-- Note: This needs to be done in Supabase Dashboard > Storage
-- Bucket name: chat-files
-- Public: YES (so images can be viewed)

-- Step 2: Set storage policies for chat-files bucket
-- ============================================

-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, bucket_id, definition, check_definition)
VALUES (
  'Authenticated users can upload files',
  'chat-files',
  '(auth.role() = ''authenticated'')',
  '(auth.role() = ''authenticated'')'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- Allow public access to view files
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Public can view files',
  'chat-files',
  'true'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- Step 3: Verify messages table structure
-- ============================================

-- Check if all columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Expected columns:
-- id, chat_id, sender_id, sender_type, message_type, content, file_url, created_at, status, delivered_at, read_at

-- Step 4: Check message policies
-- ============================================

-- Verify users can insert messages
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'messages'
AND cmd = 'INSERT';

-- Verify users can read messages
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'messages'
AND cmd = 'SELECT';

-- Step 5: Test queries
-- ============================================

-- See recent messages
SELECT 
  m.id,
  m.content,
  m.message_type,
  m.file_url,
  m.sender_type,
  u.username,
  m.created_at
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
ORDER BY m.created_at DESC
LIMIT 10;

-- See chats with message count
SELECT 
  c.id,
  c.department,
  c.status,
  u.username,
  COUNT(m.id) as message_count,
  c.created_at,
  c.updated_at
FROM chats c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN messages m ON m.chat_id = c.id
GROUP BY c.id, u.username
ORDER BY c.updated_at DESC;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If messages show empty content:
-- 1. Check if content column has data
SELECT id, content, message_type, LENGTH(content) as content_length
FROM messages
WHERE content IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if there are any NULL values
SELECT 
  COUNT(*) as total_messages,
  COUNT(content) as messages_with_content,
  COUNT(file_url) as messages_with_files
FROM messages;

-- If images don't show:
-- 1. Check if file_url is stored correctly
SELECT id, message_type, file_url, content
FROM messages
WHERE message_type IN ('image', 'file')
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verify storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'chat-files';

-- 3. Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'chat-files';

-- ============================================
-- MANUAL FIXES
-- ============================================

-- If you need to recreate the messages table:
-- WARNING: This will delete all messages!

/*
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file', 'voice')),
  content TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'sent',
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

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

CREATE POLICY "Users can update message status" 
  ON messages FOR UPDATE 
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

-- Indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_status ON messages(status);
*/

-- ============================================
-- SUCCESS VERIFICATION
-- ============================================

-- Run this to verify everything is working:

-- 1. Check if you can see messages
SELECT COUNT(*) as total_messages FROM messages;

-- 2. Check if storage bucket exists
SELECT name, public FROM storage.buckets WHERE name = 'chat-files';

-- 3. Check if policies are set
SELECT COUNT(*) as policy_count FROM storage.policies WHERE bucket_id = 'chat-files';

-- ============================================
-- DONE!
-- ============================================

