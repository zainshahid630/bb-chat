-- ============================================
-- FIX: Remove password_hash column
-- The password is stored in auth.users, not our users table
-- ============================================

-- Option 1: Drop and recreate the users table (RECOMMENDED)
-- ============================================

-- Drop existing table and recreate without password_hash
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (WITHOUT password_hash)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create chats table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Create RLS Policies
CREATE POLICY "Users can read own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

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

-- Create indexes
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_department ON chats(department);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- ============================================
-- Option 2: Just remove the password_hash column (if you have data)
-- ============================================
-- Uncomment these lines if you want to keep existing data:

-- ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- ============================================
-- DONE! Now try registering again
-- ============================================

