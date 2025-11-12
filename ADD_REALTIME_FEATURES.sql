-- ============================================
-- ADD REAL-TIME WHATSAPP-LIKE FEATURES
-- Message status, read receipts, typing indicators
-- ============================================

-- Step 1: Add status columns to messages table
-- ============================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Status values: 'sent', 'delivered', 'read'

-- Step 2: Create typing_status table for typing indicators
-- ============================================

CREATE TABLE IF NOT EXISTS typing_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Enable RLS
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Typing status policies
CREATE POLICY "Users can read typing status in their chats" 
  ON typing_status FOR SELECT 
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

CREATE POLICY "Users can update own typing status" 
  ON typing_status FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update typing status" 
  ON typing_status FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete typing status" 
  ON typing_status FOR DELETE 
  USING (user_id = auth.uid());

-- Step 3: Create function to auto-update message status
-- ============================================

-- Function to mark messages as delivered when admin opens chat
CREATE OR REPLACE FUNCTION mark_messages_delivered(p_chat_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET status = 'delivered',
      delivered_at = NOW()
  WHERE chat_id = p_chat_id
    AND sender_id != p_user_id
    AND status = 'sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read when user views them
CREATE OR REPLACE FUNCTION mark_messages_read(p_chat_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET status = 'read',
      read_at = NOW()
  WHERE chat_id = p_chat_id
    AND sender_id != p_user_id
    AND status IN ('sent', 'delivered');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Add policy for updating message status
-- ============================================

DROP POLICY IF EXISTS "Users can update message status" ON messages;

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

-- Step 5: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_typing_status_chat_id ON typing_status(chat_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_user_id ON typing_status(user_id);

-- Step 6: Enable Realtime for all tables
-- ============================================

-- Note: You also need to enable this in Supabase Dashboard
-- Go to Database > Replication and enable for:
-- - messages
-- - typing_status
-- - chats

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name IN ('status', 'delivered_at', 'read_at');

-- Check if typing_status table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'typing_status';

-- Test the functions
-- SELECT mark_messages_delivered('chat-id-here', 'user-id-here');
-- SELECT mark_messages_read('chat-id-here', 'user-id-here');

-- ============================================
-- SUCCESS! Real-time features are ready!
-- ============================================

