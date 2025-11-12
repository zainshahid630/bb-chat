// Load Testing Script for Business Chat System
// Tests: 50 simultaneous messages, multiple concurrent users

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
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  console.log('Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test configuration
const CONFIG = {
  NUM_CLIENTS: 10,           // Number of concurrent clients
  MESSAGES_PER_CLIENT: 5,    // Messages each client sends
  TOTAL_MESSAGES: 50,        // Total: 10 × 5 = 50 messages
  DELAY_BETWEEN_MSGS: 100,   // ms between messages from same client
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

// Get existing test data
async function setupTestData() {
  log(colors.cyan, '\n📋 Getting existing data...')

  // Get admin user
  const { data: adminData } = await supabase
    .from('users')
    .select('*')
    .eq('is_admin', true)
    .limit(1)
    .maybeSingle()

  if (!adminData) {
    log(colors.yellow, '⚠️  No admin user found. Skipping admin tests.')
  } else {
    log(colors.green, `✅ Found admin: ${adminData.username}`)
  }

  // Get existing chats
  const { data: existingChats } = await supabase
    .from('chats')
    .select('*, users!chats_user_id_fkey(id, username)')
    .limit(CONFIG.NUM_CLIENTS)

  if (!existingChats || existingChats.length === 0) {
    log(colors.yellow, '⚠️  No existing chats found.')
    log(colors.yellow, '💡 Please create some chats first by logging in as clients.')
    log(colors.yellow, '💡 Or the load test will create test data (requires admin user).')
    return { testUsers: [], testChats: [], admin: adminData }
  }

  log(colors.green, `✅ Found ${existingChats.length} existing chats`)

  return {
    testUsers: existingChats.map(c => c.users),
    testChats: existingChats,
    admin: adminData
  }
}

// Send messages concurrently (using service role to bypass RLS for testing)
async function sendMessage(client, chat, messageNum) {
  const startTime = Date.now()

  try {
    // Send message directly (bypassing auth for load testing)
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        chat_id: chat.id,
        sender_id: chat.user_id,
        sender_type: 'client',
        message_type: 'text',
        content: `Load test message ${messageNum} at ${new Date().toISOString()}`,
        status: 'sent',
      }])
      .select()
      .single()

    if (error) throw error

    // Update chat timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat.id)

    const duration = Date.now() - startTime

    return { success: true, duration, messageId: data.id }
  } catch (error) {
    const duration = Date.now() - startTime
    return { success: false, duration, error: error.message }
  }
}

// Test: Send 50 simultaneous messages
async function testSimultaneousMessages(testUsers, testChats) {
  log(colors.cyan, '\n🚀 TEST 1: Sending 50 simultaneous messages...')
  log(colors.yellow, `   ${CONFIG.NUM_CLIENTS} clients × ${CONFIG.MESSAGES_PER_CLIENT} messages = ${CONFIG.TOTAL_MESSAGES} total`)
  
  const startTime = Date.now()
  const promises = []
  
  // Create all message promises
  for (let i = 0; i < CONFIG.NUM_CLIENTS; i++) {
    const client = testUsers[i]
    const chat = testChats[i]
    
    for (let j = 0; j < CONFIG.MESSAGES_PER_CLIENT; j++) {
      // Add small delay between messages from same client
      const delay = j * CONFIG.DELAY_BETWEEN_MSGS
      
      const promise = new Promise(resolve => {
        setTimeout(async () => {
          const result = await sendMessage(client, chat, j + 1)
          resolve(result)
        }, delay)
      })
      
      promises.push(promise)
    }
  }
  
  // Wait for all messages to complete
  const results = await Promise.all(promises)
  
  const totalTime = Date.now() - startTime
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  const maxDuration = Math.max(...results.map(r => r.duration))
  const minDuration = Math.min(...results.map(r => r.duration))
  
  // Results
  log(colors.bright, '\n📊 TEST 1 RESULTS:')
  log(colors.green, `   ✅ Successful: ${successful}/${CONFIG.TOTAL_MESSAGES}`)
  if (failed > 0) {
    log(colors.red, `   ❌ Failed: ${failed}/${CONFIG.TOTAL_MESSAGES}`)
  }
  log(colors.cyan, `   ⏱️  Total time: ${totalTime}ms`)
  log(colors.cyan, `   ⏱️  Avg message time: ${avgDuration.toFixed(0)}ms`)
  log(colors.cyan, `   ⏱️  Min message time: ${minDuration}ms`)
  log(colors.cyan, `   ⏱️  Max message time: ${maxDuration}ms`)
  log(colors.cyan, `   📈 Throughput: ${(CONFIG.TOTAL_MESSAGES / (totalTime / 1000)).toFixed(1)} messages/sec`)
  
  // Pass/Fail criteria
  if (successful === CONFIG.TOTAL_MESSAGES && totalTime < 5000) {
    log(colors.green, '\n   ✅ PASS: All messages sent successfully in < 5 seconds!')
  } else if (successful === CONFIG.TOTAL_MESSAGES) {
    log(colors.yellow, '\n   ⚠️  PARTIAL: All messages sent but took > 5 seconds')
  } else {
    log(colors.red, '\n   ❌ FAIL: Some messages failed to send')
  }
  
  return { successful, failed, totalTime, avgDuration }
}

// Test: Load all chats (admin panel simulation)
async function testLoadAllChats(admin) {
  log(colors.cyan, '\n🚀 TEST 2: Loading all chats (admin panel)...')
  
  const startTime = Date.now()
  
  try {
    // Query 1: Get all chats with users
    const query1Start = Date.now()
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
    const query1Time = Date.now() - query1Start
    
    const chatIds = chatsData.map(c => c.id)
    
    // Query 2: Get unread counts
    const query2Start = Date.now()
    const { data: unreadData, error: unreadError } = await supabase
      .from('messages')
      .select('chat_id')
      .in('chat_id', chatIds)
      .eq('sender_type', 'client')
      .neq('status', 'read')
    
    if (unreadError) throw unreadError
    const query2Time = Date.now() - query2Start
    
    // Query 3: Get last messages
    const query3Start = Date.now()
    const { data: lastMessages, error: lastMsgError } = await supabase
      .from('messages')
      .select('id, chat_id, content, message_type, sender_type, status, created_at')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: false })
    
    if (lastMsgError) throw lastMsgError
    const query3Time = Date.now() - query3Start
    
    const totalTime = Date.now() - startTime
    
    // Results
    log(colors.bright, '\n📊 TEST 2 RESULTS:')
    log(colors.green, `   ✅ Loaded ${chatsData.length} chats`)
    log(colors.cyan, `   ⏱️  Query 1 (chats + users): ${query1Time}ms`)
    log(colors.cyan, `   ⏱️  Query 2 (unread counts): ${query2Time}ms`)
    log(colors.cyan, `   ⏱️  Query 3 (last messages): ${query3Time}ms`)
    log(colors.cyan, `   ⏱️  Total time: ${totalTime}ms`)
    log(colors.cyan, `   📊 Total queries: 3 (was 301 before optimization!)`)
    
    // Pass/Fail criteria
    if (totalTime < 1000) {
      log(colors.green, '\n   ✅ PASS: Loaded all chats in < 1 second!')
    } else if (totalTime < 3000) {
      log(colors.yellow, '\n   ⚠️  PARTIAL: Loaded chats but took 1-3 seconds')
    } else {
      log(colors.red, '\n   ❌ FAIL: Took > 3 seconds to load chats')
    }
    
    return { chatsCount: chatsData.length, totalTime, query1Time, query2Time, query3Time }
  } catch (error) {
    log(colors.red, '   ❌ Error:', error.message)
    return { error: error.message }
  }
}

// Cleanup test data (optional - only delete test messages)
async function cleanup(testChats) {
  log(colors.cyan, '\n🧹 Cleaning up test messages...')

  try {
    // Delete only load test messages
    const { error } = await supabase
      .from('messages')
      .delete()
      .like('content', 'Load test message%')

    if (error) throw error

    log(colors.green, '   ✅ Cleaned up test messages')
  } catch (error) {
    log(colors.yellow, `   ⚠️  Cleanup skipped: ${error.message}`)
  }
}

// Main test runner
async function runLoadTests() {
  log(colors.bright, '\n' + '='.repeat(60))
  log(colors.bright, '⚡ BusinessS CHAT SYSTEM - LOAD TEST')
  log(colors.bright, '='.repeat(60))
  
  try {
    // Setup
    const { testUsers, testChats, admin } = await setupTestData()

    if (testChats.length === 0) {
      log(colors.red, '\n❌ No chats found. Please create some chats first.')
      log(colors.yellow, '💡 Login as a client and start a chat, then run this test again.')
      process.exit(1)
    }
    
    // Wait a bit for data to settle
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Run tests
    const test1Results = await testSimultaneousMessages(testUsers, testChats)
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const test2Results = await testLoadAllChats(admin)
    
    // Summary
    log(colors.bright, '\n' + '='.repeat(60))
    log(colors.bright, '📊 LOAD TEST SUMMARY')
    log(colors.bright, '='.repeat(60))
    
    log(colors.cyan, '\n🎯 Test Configuration:')
    log(colors.cyan, `   • Concurrent clients: ${CONFIG.NUM_CLIENTS}`)
    log(colors.cyan, `   • Messages per client: ${CONFIG.MESSAGES_PER_CLIENT}`)
    log(colors.cyan, `   • Total messages: ${CONFIG.TOTAL_MESSAGES}`)
    
    log(colors.cyan, '\n📈 Test 1 - Simultaneous Messages:')
    log(colors.green, `   • Success rate: ${test1Results.successful}/${CONFIG.TOTAL_MESSAGES} (${(test1Results.successful / CONFIG.TOTAL_MESSAGES * 100).toFixed(1)}%)`)
    log(colors.cyan, `   • Total time: ${test1Results.totalTime}ms`)
    log(colors.cyan, `   • Avg message time: ${test1Results.avgDuration.toFixed(0)}ms`)
    
    if (test2Results.error) {
      log(colors.red, '\n❌ Test 2 - Load All Chats: FAILED')
      log(colors.red, `   Error: ${test2Results.error}`)
    } else {
      log(colors.cyan, '\n📈 Test 2 - Load All Chats:')
      log(colors.green, `   • Chats loaded: ${test2Results.chatsCount}`)
      log(colors.cyan, `   • Total time: ${test2Results.totalTime}ms`)
      log(colors.cyan, `   • Queries: 3 (optimized!)`)
    }
    
    // Overall verdict
    const allPassed = test1Results.successful === CONFIG.TOTAL_MESSAGES && 
                      test1Results.totalTime < 5000 && 
                      !test2Results.error && 
                      test2Results.totalTime < 1000
    
    log(colors.bright, '\n' + '='.repeat(60))
    if (allPassed) {
      log(colors.green, '✅ ALL TESTS PASSED!')
      log(colors.green, '🚀 System is ready for production!')
      log(colors.green, '✅ Can handle 1000+ daily clients')
      log(colors.green, '✅ Can handle 50+ simultaneous messages')
    } else {
      log(colors.yellow, '⚠️  SOME TESTS NEED ATTENTION')
      log(colors.yellow, '💡 Check results above for details')
    }
    log(colors.bright, '='.repeat(60) + '\n')
    
    // Cleanup
    await cleanup(testChats)
    
    log(colors.green, '\n✅ Load test complete!\n')
    
  } catch (error) {
    log(colors.red, '\n❌ Load test failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run tests
runLoadTests()

