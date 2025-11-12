-- ============================================
-- ADD MESSAGE STATUS (TICKS) - SIMPLIFIED
-- Works without Realtime replication
-- ============================================

-- Step 1: Add status columns to messages table
-- ============================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Status values: 'sent', 'delivered', 'read'

-- Step 2: Create functions to update message status
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

-- Step 3: Add policy for updating message status
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

-- Step 4: Create index for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name IN ('status', 'delivered_at', 'read_at');

-- Test the functions (replace with actual IDs)
-- SELECT mark_messages_delivered('chat-id-here', 'user-id-here');
-- SELECT mark_messages_read('chat-id-here', 'user-id-here');

-- See message status
SELECT id, content, status, delivered_at, read_at, created_at
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- SUCCESS! Message status is ready!
-- ============================================

-- How it works:
-- 1. When client sends message -> status = 'sent' (✓)
-- 2. When admin opens chat -> status = 'delivered' (✓✓)
-- 3. When admin views message -> status = 'read' (✓✓ blue)

