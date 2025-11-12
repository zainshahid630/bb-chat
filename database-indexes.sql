-- ============================================
-- CRITICAL DATABASE INDEXES FOR PERFORMANCE
-- Run these in Supabase SQL Editor
-- ============================================

-- Messages table indexes
-- These will speed up message queries by 10-20x

-- Index for fetching messages by chat (most common query)
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON messages(chat_id, created_at DESC);

-- Index for fetching messages by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id, created_at DESC);

-- Index for counting unread messages (partial index - more efficient)
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(chat_id, sender_type, status) 
WHERE status != 'read';

-- Index for message status updates
CREATE INDEX IF NOT EXISTS idx_messages_status 
ON messages(status, created_at DESC);

-- ============================================

-- Chats table indexes
-- Speed up chat list queries

-- Index for fetching user's chats
CREATE INDEX IF NOT EXISTS idx_chats_user_status 
ON chats(user_id, status, updated_at DESC);

-- Index for admin chat list (sorted by recent activity)
CREATE INDEX IF NOT EXISTS idx_chats_updated 
ON chats(updated_at DESC);

-- Index for filtering by department
CREATE INDEX IF NOT EXISTS idx_chats_department 
ON chats(department, status, updated_at DESC);

-- ============================================

-- Users table indexes
-- Speed up user lookups

-- Index for username lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_username 
ON users(username);

-- Index for phone number lookups (OTP)
CREATE INDEX IF NOT EXISTS idx_users_phone 
ON users(phone_number) 
WHERE phone_number IS NOT NULL;

-- Index for admin users
CREATE INDEX IF NOT EXISTS idx_users_admin 
ON users(is_admin) 
WHERE is_admin = true;

-- ============================================

-- Typing status indexes
-- Speed up typing indicator queries

CREATE INDEX IF NOT EXISTS idx_typing_chat 
ON typing_status(chat_id, is_typing, updated_at DESC);

-- ============================================

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('messages', 'chats', 'users', 'typing_status')
ORDER BY tablename, indexname;

-- ============================================

-- Analyze tables to update statistics
ANALYZE messages;
ANALYZE chats;
ANALYZE users;
ANALYZE typing_status;

-- ============================================

-- Test query performance (before and after indexes)
-- Run this to see the improvement

EXPLAIN ANALYZE 
SELECT m.*, u.username
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE m.chat_id = (SELECT id FROM chats LIMIT 1)
ORDER BY m.created_at DESC
LIMIT 30;

-- Should show "Index Scan" instead of "Seq Scan"
-- Execution time should be < 10ms

-- ============================================
