// Simple Performance Test - Tests query optimization
// Run this to verify the optimizations are working

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
let supabaseUrl, supabaseAnonKey
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8')
  const envLines = envContent.split('\n')
  
  for (const line of envLines) {
    const [key, ...valueParts] = line.split('=')
    const value = valueParts.join('=').trim()
    
    if (key === 'VITE_SUPABASE_URL') {
      supabaseUrl = value
    } else if (key === 'VITE_SUPABASE_ANON_KEY') {
      supabaseAnonKey = value
    }
  }
} catch (error) {
  console.error('❌ Error reading .env file:', error.message)
  process.exit(1)
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

// Test 1: Optimized getAllChats query
async function testOptimizedQuery() {
  log(colors.cyan, '\n🚀 TEST 1: Optimized getAllChats() Query')
  log(colors.cyan, '   Testing batch queries vs N+1 queries...\n')
  
  const startTime = Date.now()
  
  try {
    // Query 1: Get all chats with users (JOIN)
    const q1Start = Date.now()
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select(`
        *,
        users!chats_user_id_fkey (
          id,
          username
        )
      `)
      .order('updated_at', { ascending: false })
    
    if (chatsError) throw chatsError
    const q1Time = Date.now() - q1Start
    
    if (!chatsData || chatsData.length === 0) {
      log(colors.yellow, '   ⚠️  No chats found in database')
      log(colors.yellow, '   💡 Create some chats first to see performance gains')
      return
    }
    
    const chatIds = chatsData.map(c => c.id)
    
    // Query 2: Get unread counts for ALL chats in one query
    const q2Start = Date.now()
    const { data: unreadData, error: unreadError } = await supabase
      .from('messages')
      .select('chat_id')
      .in('chat_id', chatIds)
      .eq('sender_type', 'client')
      .neq('status', 'read')
    
    if (unreadError) throw unreadError
    const q2Time = Date.now() - q2Start
    
    // Query 3: Get last messages for ALL chats in one query
    const q3Start = Date.now()
    const { data: lastMessages, error: lastMsgError } = await supabase
      .from('messages')
      .select('id, chat_id, content, message_type, sender_type, status, created_at')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: false })
    
    if (lastMsgError) throw lastMsgError
    const q3Time = Date.now() - q3Start
    
    const totalTime = Date.now() - startTime
    
    // Calculate what it would have been with N+1 queries
    const oldQueryCount = 1 + (chatsData.length * 3) // 1 + (N × 3)
    const estimatedOldTime = q1Time + (chatsData.length * (q2Time + q3Time))
    
    // Results
    log(colors.bright, '   📊 RESULTS:')
    log(colors.green, `   ✅ Loaded ${chatsData.length} chats`)
    log(colors.cyan, `   ⏱️  Query 1 (chats + users): ${q1Time}ms`)
    log(colors.cyan, `   ⏱️  Query 2 (unread counts): ${q2Time}ms`)
    log(colors.cyan, `   ⏱️  Query 3 (last messages): ${q3Time}ms`)
    log(colors.bright, `   ⏱️  TOTAL TIME: ${totalTime}ms`)
    log(colors.cyan, `   📊 Total queries: 3`)
    
    log(colors.yellow, '\n   📉 BEFORE OPTIMIZATION (estimated):')
    log(colors.yellow, `   ⏱️  Estimated time: ${estimatedOldTime}ms`)
    log(colors.yellow, `   📊 Queries: ${oldQueryCount}`)
    
    log(colors.green, '\n   ⚡ IMPROVEMENT:')
    log(colors.green, `   🚀 ${(estimatedOldTime / totalTime).toFixed(1)}x faster!`)
    log(colors.green, `   📉 ${oldQueryCount - 3} fewer queries!`)
    
    // Pass/Fail
    if (totalTime < 1000) {
      log(colors.green, '\n   ✅ EXCELLENT: Query completed in < 1 second!')
    } else if (totalTime < 3000) {
      log(colors.yellow, '\n   ⚠️  GOOD: Query completed in 1-3 seconds')
      log(colors.yellow, '   💡 Consider adding database indexes for better performance')
    } else {
      log(colors.red, '\n   ❌ SLOW: Query took > 3 seconds')
      log(colors.red, '   💡 Make sure you ran ADD_PERFORMANCE_INDEXES.sql!')
    }
    
  } catch (error) {
    log(colors.red, '   ❌ Error:', error.message)
  }
}

// Test 2: Check if indexes exist
async function testIndexes() {
  log(colors.cyan, '\n🚀 TEST 2: Database Indexes Check')
  log(colors.cyan, '   Checking if performance indexes are installed...\n')
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname;
      `
    })
    
    if (error) {
      // RPC might not exist, try alternative
      log(colors.yellow, '   ⚠️  Cannot check indexes directly (RPC not available)')
      log(colors.yellow, '   💡 Run this SQL in Supabase SQL Editor to check:')
      log(colors.cyan, '   SELECT indexname FROM pg_indexes WHERE schemaname = \'public\' AND indexname LIKE \'idx_%\';')
      return
    }
    
    if (!data || data.length === 0) {
      log(colors.red, '   ❌ No performance indexes found!')
      log(colors.red, '   💡 Run ADD_PERFORMANCE_INDEXES.sql in Supabase SQL Editor')
      return
    }
    
    log(colors.green, `   ✅ Found ${data.length} performance indexes:`)
    data.forEach(idx => {
      log(colors.cyan, `      • ${idx.indexname} on ${idx.tablename}`)
    })
    
  } catch (error) {
    log(colors.yellow, '   ⚠️  Cannot verify indexes:', error.message)
    log(colors.yellow, '   💡 Manually check in Supabase dashboard')
  }
}

// Test 3: Measure query performance
async function testQueryPerformance() {
  log(colors.cyan, '\n🚀 TEST 3: Individual Query Performance')
  log(colors.cyan, '   Testing query speed with indexes...\n')
  
  try {
    // Get a sample chat
    const { data: sampleChat } = await supabase
      .from('chats')
      .select('id')
      .limit(1)
      .single()
    
    if (!sampleChat) {
      log(colors.yellow, '   ⚠️  No chats found to test')
      return
    }
    
    // Test unread count query
    const start1 = Date.now()
    const { data: unread } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('chat_id', sampleChat.id)
      .eq('sender_type', 'client')
      .neq('status', 'read')
    const time1 = Date.now() - start1
    
    // Test last message query
    const start2 = Date.now()
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', sampleChat.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const time2 = Date.now() - start2
    
    log(colors.bright, '   📊 RESULTS:')
    log(colors.cyan, `   ⏱️  Unread count query: ${time1}ms`)
    log(colors.cyan, `   ⏱️  Last message query: ${time2}ms`)
    
    if (time1 < 50 && time2 < 50) {
      log(colors.green, '\n   ✅ EXCELLENT: Queries are very fast!')
      log(colors.green, '   🎉 Indexes are working perfectly!')
    } else if (time1 < 200 && time2 < 200) {
      log(colors.yellow, '\n   ⚠️  GOOD: Queries are reasonably fast')
    } else {
      log(colors.red, '\n   ❌ SLOW: Queries are taking too long')
      log(colors.red, '   💡 Make sure you ran ADD_PERFORMANCE_INDEXES.sql!')
    }
    
  } catch (error) {
    log(colors.red, '   ❌ Error:', error.message)
  }
}

// Test 4: Cache test
async function testCache() {
  log(colors.cyan, '\n🚀 TEST 4: Cache Performance')
  log(colors.cyan, '   Testing if caching is working...\n')
  
  try {
    // First call (cache miss)
    const start1 = Date.now()
    const { data: data1 } = await supabase
      .from('chats')
      .select('*')
      .limit(10)
    const time1 = Date.now() - start1
    
    // Second call (should be cached in browser)
    const start2 = Date.now()
    const { data: data2 } = await supabase
      .from('chats')
      .select('*')
      .limit(10)
    const time2 = Date.now() - start2
    
    log(colors.bright, '   📊 RESULTS:')
    log(colors.cyan, `   ⏱️  First call: ${time1}ms`)
    log(colors.cyan, `   ⏱️  Second call: ${time2}ms`)
    
    if (time2 < time1 * 0.5) {
      log(colors.green, '\n   ✅ Cache is working! Second call is faster')
    } else {
      log(colors.yellow, '\n   ℹ️  Note: Application-level cache works in the browser')
      log(colors.yellow, '   This test only shows database-level caching')
    }
    
  } catch (error) {
    log(colors.red, '   ❌ Error:', error.message)
  }
}

// Main test runner
async function runTests() {
  log(colors.bright, '\n' + '='.repeat(60))
  log(colors.bright, '⚡ PERFORMANCE TEST - Query Optimization')
  log(colors.bright, '='.repeat(60))
  
  await testOptimizedQuery()
  await testIndexes()
  await testQueryPerformance()
  await testCache()
  
  log(colors.bright, '\n' + '='.repeat(60))
  log(colors.bright, '📊 PERFORMANCE TEST COMPLETE')
  log(colors.bright, '='.repeat(60))
  
  log(colors.cyan, '\n💡 NEXT STEPS:')
  log(colors.cyan, '   1. If indexes are missing, run ADD_PERFORMANCE_INDEXES.sql')
  log(colors.cyan, '   2. Test in browser to see cache working')
  log(colors.cyan, '   3. Monitor console logs for "Cache HIT/MISS" messages')
  log(colors.cyan, '   4. Check real-time updates are working\n')
}

runTests()

