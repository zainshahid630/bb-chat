-- ============================================
-- 🔧 FIX INDEXES - Force PostgreSQL to Use Them
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DROP OLD INDEXES (Clean Start)
-- ============================================

DROP INDEX IF EXISTS idx_messages_chat_created;
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_messages_unread;
DROP INDEX IF EXISTS idx_messages_status;
DROP INDEX IF EXISTS idx_chats_user_status;
DROP INDEX IF EXISTS idx_chats_updated;
DROP INDEX IF EXISTS idx_chats_department;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_admin;
DROP INDEX IF EXISTS idx_users_blocked;
DROP INDEX IF EXISTS idx_typing_chat;

-- ============================================
-- STEP 2: CREATE INDEXES WITH PROPER SETTINGS
-- ============================================

-- Messages table indexes (MOST CRITICAL)
CREATE INDEX idx_messages_chat_created 
ON messages(chat_id, created_at DESC);

CREATE INDEX idx_messages_sender 
ON messages(sender_id, created_at DESC);

CREATE INDEX idx_messages_unread 
ON messages(chat_id, sender_type, status) 
WHERE status != 'read';

CREATE INDEX idx_messages_status 
ON messages(status, created_at DESC);

-- Chats table indexes
CREATE INDEX idx_chats_user_status 
ON chats(user_id, status, updated_at DESC);

CREATE INDEX idx_chats_updated 
ON chats(updated_at DESC);

CREATE INDEX idx_chats_department 
ON chats(department, status, updated_at DESC);

-- Users table indexes
CREATE INDEX idx_users_username 
ON users(username);

CREATE INDEX idx_users_phone 
ON users(phone_number) 
WHERE phone_number IS NOT NULL;

CREATE INDEX idx_users_admin 
ON users(is_admin) 
WHERE is_admin = true;

CREATE INDEX idx_users_blocked
ON users(is_blocked, created_at DESC);

-- Typing status indexes
CREATE INDEX idx_typing_chat 
ON typing_status(chat_id, is_typing, updated_at DESC);

-- ============================================
-- STEP 3: VACUUM AND ANALYZE (CRITICAL!)
-- ============================================

-- This updates statistics and helps PostgreSQL use indexes
VACUUM ANALYZE messages;
VACUUM ANALYZE chats;
VACUUM ANALYZE users;
VACUUM ANALYZE typing_status;

-- ============================================
-- STEP 4: FORCE INDEX USAGE (For Small Tables)
-- ============================================

-- If your tables are small, PostgreSQL might prefer sequential scans
-- This is actually FASTER for small tables!
-- But we can adjust the cost settings to prefer indexes:

-- Check current settings
SHOW seq_page_cost;
SHOW random_page_cost;

-- Temporarily adjust for this session (optional)
-- SET seq_page_cost = 2.0;
-- SET random_page_cost = 1.1;

-- ============================================
-- STEP 5: VERIFY INDEXES EXIST
-- ============================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('messages', 'chats', 'users', 'typing_status')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- You should see 12 indexes listed

-- ============================================
-- STEP 6: CHECK INDEX SIZES
-- ============================================

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- STEP 7: TEST QUERY WITH ACTUAL CHAT ID
-- ============================================

-- First, get a real chat_id
SELECT id, department, status, created_at 
FROM chats 
ORDER BY created_at DESC 
LIMIT 5;

-- Now test with a real chat_id (replace 'YOUR-CHAT-ID' with actual ID from above)
-- EXPLAIN ANALYZE 
-- SELECT m.*, u.username
-- FROM messages m
-- LEFT JOIN users u ON m.sender_id = u.id
-- WHERE m.chat_id = 'YOUR-CHAT-ID'
-- ORDER BY m.created_at DESC
-- LIMIT 30;

-- ============================================
-- STEP 8: ALTERNATIVE TEST - Check All Messages
-- ============================================

-- Test loading recent messages across all chats
EXPLAIN ANALYZE
SELECT m.*, u.username, c.department
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
LEFT JOIN chats c ON m.chat_id = c.id
ORDER BY m.created_at DESC
LIMIT 50;

-- This should use idx_messages_status or show fast execution

-- ============================================
-- STEP 9: TEST UNREAD COUNT QUERY
-- ============================================

EXPLAIN ANALYZE
SELECT 
    chat_id, 
    COUNT(*) as unread_count
FROM messages
WHERE sender_type = 'client' 
AND status != 'read'
GROUP BY chat_id;

-- Should use idx_messages_unread (partial index)

-- ============================================
-- STEP 10: TEST CHAT LIST QUERY
-- ============================================

EXPLAIN ANALYZE
SELECT c.*, u.username
FROM chats c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.updated_at DESC
LIMIT 100;

-- Should use idx_chats_updated

-- ============================================
-- ✅ UNDERSTANDING THE RESULTS
-- ============================================

-- GOOD SIGNS:
-- ✅ "Index Scan using idx_..." - Index is being used
-- ✅ Execution time < 50ms - Fast query
-- ✅ No "Seq Scan" on large tables - Efficient

-- ACCEPTABLE SIGNS (For Small Tables):
-- ⚠️ "Seq Scan" with execution time < 10ms - Actually faster for small data
-- ⚠️ "Bitmap Index Scan" - PostgreSQL's optimization, still good

-- BAD SIGNS:
-- ❌ "Seq Scan" with execution time > 100ms - Index not being used
-- ❌ Rows Removed by Filter: 10000+ - Inefficient filtering

-- ============================================
-- 📊 IMPORTANT NOTE ABOUT SMALL TABLES
-- ============================================

-- If your tables have < 1000 rows, PostgreSQL will often use
-- sequential scans because they're actually FASTER than indexes!
-- 
-- This is NORMAL and GOOD behavior!
-- 
-- As your data grows, PostgreSQL will automatically start using
-- the indexes when they become more efficient.
--
-- Current execution time of 0.066ms is EXCELLENT!
-- Don't worry if you see "Seq Scan" - it's fast!

-- ============================================
-- 🎯 WHAT MATTERS MOST
-- ============================================

-- Focus on these metrics:
-- 1. Execution Time < 50ms ✅ (You have 0.066ms - EXCELLENT!)
-- 2. Planning Time < 5ms ✅ (You have 0.540ms - GOOD!)
-- 3. No errors ✅
-- 4. Query completes successfully ✅

-- Your current performance is ALREADY OPTIMIZED!
-- The indexes are ready and will be used automatically
-- when your data grows larger.

-- ============================================
-- ✅ DONE!
-- ============================================

-- Your indexes are properly created and ready to use!
-- As your chat system grows, these indexes will automatically
-- kick in and keep queries fast.
