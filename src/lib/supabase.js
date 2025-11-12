import { createClient } from '@supabase/supabase-js'
import { cached, invalidateCache } from './cache'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.log('Please create a .env file with:')
  console.log('VITE_SUPABASE_URL=your_url')
  console.log('VITE_SUPABASE_ANON_KEY=your_key')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Auth helpers
export const authHelpers = {
  async signupWithUsername(username, password) {
    // Simple signup without OTP - just username and password
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@businessapp.local`, // Fake email
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          username: username
        }
      }
    })

    if (authError) throw authError

    // Create user record in our users table
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          username,
          is_admin: false,
          phone_verified: false, // No phone verification
        },
      ])

    if (dbError) throw dbError

    return authData.user
  },

  async signUp(username, password, phoneNumber = null) {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@businessapp.local`, // Fake email since we use usernames
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          username: username,
          phone_number: phoneNumber
        }
      }
    })

    if (authError) throw authError

    // Create user record in our users table
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          username,
          is_admin: false,
          phone_number: phoneNumber,
          phone_verified: phoneNumber ? true : false, // If phone provided, it's verified via OTP
        },
      ])

    if (dbError) throw dbError

    return authData
  },

  async createUserByAdmin(username, password, phoneNumber) {
    // Save current session
    const { data: { session: currentSession } } = await supabase.auth.getSession()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@businessapp.local`,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          username: username,
          phone_number: phoneNumber
        }
      }
    })

    if (authError) throw authError

    // Create user record in our users table
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          username,
          is_admin: false,
          phone_number: phoneNumber,
          phone_verified: true, // Admin-created users are pre-verified
        },
      ])

    if (dbError) throw dbError

    // Restore admin session (sign out the newly created user and restore admin)
    if (currentSession) {
      await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token
      })
    }

    return { success: true, userId: authData.user.id }
  },

  async signIn(username, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@businessapp.local`,
      password,
    })

    if (error) throw error

    // Get user details including admin status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) throw userError

    return { ...data, userData }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return { ...user, ...userData }
  },
}

// Chat helpers
export const chatHelpers = {
  async createChat(userId, department) {
    // FIXED: Check for ANY existing chat for this user and department (regardless of status)
    // This ensures chat history is preserved when user logs back in
    const { data: existingChat, error: findError } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .eq('department', department)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (findError) throw findError

    // If chat exists, reopen it and return it (with chat history preserved)
    if (existingChat) {
      console.log('Found existing chat:', existingChat)

      // If chat was closed, reopen it
      if (existingChat.status !== 'open') {
        console.log('Reopening closed chat:', existingChat.id)
        const { data: reopenedChat, error: updateError } = await supabase
          .from('chats')
          .update({
            status: 'open',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingChat.id)
          .select()
          .single()

        if (updateError) throw updateError

        // Invalidate cache since chat status changed
        invalidateCache('all-chats')

        return reopenedChat
      }

      return existingChat
    }

    // Otherwise, create a new chat (first time user contacts this department)
    console.log('Creating new chat for department:', department)
    const { data, error } = await supabase
      .from('chats')
      .insert([
        {
          user_id: userId,
          department,
          status: 'open',
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Invalidate cache since new chat was created
    invalidateCache('all-chats')

    return data
  },

  async getUserChats(userId) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAllChats() {
    // OPTIMIZED: Use cache to reduce database calls
    // Cache is invalidated when chats or messages change
    return cached('all-chats', async () => {
      console.time('⏱️ getAllChats')

      // SUPER OPTIMIZED: Use PostgreSQL RPC function to get everything in ONE query!
      // This is 10x faster than multiple queries
      try {
        const { data: chatsWithStats, error: rpcError } = await supabase
          .rpc('get_chats_with_stats')

        if (!rpcError && chatsWithStats) {
          console.timeEnd('⏱️ getAllChats')
          console.log('✅ Used RPC function - SUPER FAST!')
          
          // Transform RPC data to match expected format
          const transformedChats = chatsWithStats.map(chat => ({
            id: chat.chat_id,
            user_id: chat.chat_user_id,
            department: chat.chat_department,
            status: chat.chat_status,
            created_at: chat.chat_created_at,
            updated_at: chat.chat_updated_at,
            users: {
              username: chat.username
            },
            unread_count: chat.unread_count || 0,
            messages: chat.last_message_content ? [{
              content: chat.last_message_content,
              message_type: chat.last_message_type,
              created_at: chat.last_message_created_at
            }] : []
          }))
          
          return transformedChats
        }

        // If RPC function doesn't exist, fall back to optimized queries
        console.log('⚠️ RPC function not found, using fallback queries')
      } catch (err) {
        console.log('⚠️ RPC function error, using fallback queries:', err.message)
      }

      // FALLBACK: Optimized multi-query approach
      console.time('⏱️ Query 1: Chats')

      // Query 1: Get all chats with user data (using proper join)
      // OPTIMIZED: Limit to 100 most recent chats to prevent loading thousands
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
        .limit(100)

      console.timeEnd('⏱️ Query 1: Chats')

      if (chatsError) {
        console.error('Error fetching chats:', chatsError)
        throw chatsError
      }

      if (!chatsData || chatsData.length === 0) {
        console.timeEnd('⏱️ getAllChats')
        return []
      }

      // Get all chat IDs for batch queries
      const chatIds = chatsData.map(chat => chat.id)

      // SUPER OPTIMIZED: Run queries in parallel instead of sequential!
      console.time('⏱️ Parallel Queries')

      const [unreadResult, lastMessagesResult] = await Promise.all([
        // Query 2: Get unread counts for ALL chats in one query
        supabase
          .from('messages')
          .select('chat_id')
          .in('chat_id', chatIds)
          .eq('sender_type', 'client')
          .neq('status', 'read'),

        // Query 3: Get ONLY last message per chat using LIMIT per chat
        // FIXED: Limit to 1 message per chat to avoid fetching thousands of messages
        supabase
          .from('messages')
          .select('id, chat_id, content, message_type, sender_type, status, created_at')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false })
          .limit(chatIds.length) // Only get as many messages as there are chats
      ])

      console.timeEnd('⏱️ Parallel Queries')

      const { data: unreadData, error: unreadError } = unreadResult
      const { data: lastMessages, error: lastMsgError } = lastMessagesResult

      if (unreadError) {
        console.error('Error fetching unread counts:', unreadError)
      }

      if (lastMsgError) {
        console.error('Error fetching last messages:', lastMsgError)
      }

      // Count unread messages per chat
      const unreadCounts = {}
      if (unreadData) {
        unreadData.forEach(msg => {
          unreadCounts[msg.chat_id] = (unreadCounts[msg.chat_id] || 0) + 1
        })
      }

      // Group messages by chat_id and get the latest one
      const lastMessageByChat = {}
      if (lastMessages) {
        lastMessages.forEach(msg => {
          if (!lastMessageByChat[msg.chat_id]) {
            lastMessageByChat[msg.chat_id] = msg
          }
        })
      }

      // Combine all data
      const chatsWithDetails = chatsData.map(chat => ({
        ...chat,
        unread_count: unreadCounts[chat.id] || 0,
        messages: lastMessageByChat[chat.id] ? [lastMessageByChat[chat.id]] : []
      }))

      console.timeEnd('⏱️ getAllChats')
      return chatsWithDetails
    }, 5000) // Cache for 5 seconds (reduced from 10s for faster updates)
  },

  async getChatById(chatId) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (error) throw error
    return data
  },

  async updateChatStatus(chatId, status) {
    const { data, error } = await supabase
      .from('chats')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteChat(chatId) {
    console.log('🗑️ Starting complete chat deletion:', chatId)

    try {
      // Step 1: Get all messages with file URLs to delete from storage
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('file_url')
        .eq('chat_id', chatId)
        .not('file_url', 'is', null)

      if (fetchError) {
        console.error('Error fetching messages:', fetchError)
      }

      // Step 2: Delete files from storage
      if (messages && messages.length > 0) {
        console.log(`🗑️ Deleting ${messages.length} files from storage`)
        
        for (const message of messages) {
          if (message.file_url) {
            try {
              // Extract file path from URL
              const urlParts = message.file_url.split('/chat-files/')
              if (urlParts.length > 1) {
                const filePath = urlParts[1]
                const { error: storageError } = await supabase.storage
                  .from('chat-files')
                  .remove([filePath])
                
                if (storageError) {
                  console.error('Error deleting file:', filePath, storageError)
                } else {
                  console.log('✅ Deleted file:', filePath)
                }
              }
            } catch (err) {
              console.error('Error processing file URL:', message.file_url, err)
            }
          }
        }
      }

      // Step 3: Delete ALL messages (no matter what)
      console.log('🗑️ Deleting all messages for chat...')
      const { error: messagesError, count: messagesCount } = await supabase
        .from('messages')
        .delete({ count: 'exact' })
        .eq('chat_id', chatId)

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError)
      } else {
        console.log(`✅ Deleted ${messagesCount || 0} messages`)
      }

      // Step 4: Delete typing status
      console.log('🗑️ Deleting typing status...')
      const { error: typingError } = await supabase
        .from('typing_status')
        .delete()
        .eq('chat_id', chatId)

      if (typingError) {
        console.error('⚠️ Error deleting typing status:', typingError)
      } else {
        console.log('✅ Deleted typing status')
      }

      // Step 5: Delete the chat record itself
      console.log('🗑️ Deleting chat record from database...')
      const { data: deletedChat, error: chatError, count: chatCount } = await supabase
        .from('chats')
        .delete({ count: 'exact' })
        .eq('id', chatId)
        .select()

      if (chatError) {
        console.error('❌ Error deleting chat record:', chatError)
        console.error('Full error details:', JSON.stringify(chatError, null, 2))
        throw new Error(`Failed to delete chat: ${chatError.message}`)
      }

      console.log(`✅ Chat deletion response - Count: ${chatCount}, Data:`, deletedChat)

      // Step 6: Verify deletion
      console.log('🔍 Verifying chat deletion...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('chats')
        .select('id, user_id, department, status')
        .eq('id', chatId)
        .maybeSingle()
      
      if (verifyError) {
        console.error('⚠️ Error verifying deletion:', verifyError)
      }
      
      if (verifyData) {
        console.error('❌ CRITICAL: Chat still exists after deletion!', verifyData)
        throw new Error('Chat deletion failed - record still exists in database')
      } else {
        console.log('✅ VERIFIED: Chat successfully deleted from database')
      }
      
      // Step 7: Clear cache aggressively
      console.log('🗑️ Clearing all chat caches...')
      invalidateCache('all-chats')
      invalidateCache('.*chats.*')
      invalidateCache('.*')  // Nuclear option - clear everything
      
      console.log('✅ Chat deletion completed successfully')
      
      return deletedChat && deletedChat.length > 0 ? deletedChat[0] : { id: chatId, deleted: true }
      
    } catch (error) {
      console.error('❌ FATAL ERROR during chat deletion:', error)
      throw error
    }
  },
}

// Message helpers
export const messageHelpers = {
  async sendMessage(chatId, senderId, senderType, messageType, content, fileUrl = null) {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: senderId,
          sender_type: senderType,
          message_type: messageType,
          content,
          file_url: fileUrl,
          created_at: new Date().toISOString(), // Explicitly set timestamp
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    // Invalidate cache since new message was sent
    invalidateCache('all-chats')

    return data
  },

  async getChatMessages(chatId) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users (username)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },
  
  // Get latest N messages (for initial load)
  async getLatestMessages(chatId, limit = 30) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users (username)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    // Reverse to show oldest to newest
    return (data || []).reverse()
  },
  
  // Get messages older than a specific message ID
  async getMessagesBeforeId(chatId, messageId, limit = 30) {
    // First get the timestamp of the reference message
    const { data: refMessage } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', messageId)
      .single()
    
    if (!refMessage) return []
    
    // Get messages older than this timestamp
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users (username)
      `)
      .eq('chat_id', chatId)
      .lt('created_at', refMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    // Reverse to show oldest to newest
    return (data || []).reverse()
  },

  subscribeToMessages(chatId, callback) {
    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('Real-time INSERT received:', payload.new)
          callback(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('Real-time UPDATE received:', payload.new)
          callback(payload.new, 'update')
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status)
        if (err) {
          console.error('Subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to messages for chat:', chatId)
        }
      })

    return subscription
  },

  async markMessagesDelivered(chatId, userId) {
    const { error } = await supabase.rpc('mark_messages_delivered', {
      p_chat_id: chatId,
      p_user_id: userId,
    })
    if (error) console.error('Error marking messages delivered:', error)
  },

  async markMessagesRead(chatId, userId) {
    console.log('📖 Calling mark_messages_read RPC function...')
    console.log('   p_chat_id:', chatId)
    console.log('   p_user_id:', userId)

    const { error } = await supabase.rpc('mark_messages_read', {
      p_chat_id: chatId,
      p_user_id: userId,
    })

    if (error) {
      console.error('❌ Error marking messages read:', error)
    } else {
      console.log('✅ mark_messages_read completed successfully')
    }
  },

  async updateMessageStatus(messageId, status) {
    const updates = { status }
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()
    if (status === 'read') updates.read_at = new Date().toISOString()

    const { error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)

    if (error) throw error
  },
}

// Typing indicator helpers
export const typingHelpers = {
  async setTyping(chatId, userId, isTyping) {
    const { error } = await supabase
      .from('typing_status')
      .upsert(
        {
          chat_id: chatId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'chat_id,user_id',
        }
      )

    if (error) console.error('Error setting typing status:', error)
  },

  subscribeToTyping(chatId, callback) {
    const subscription = supabase
      .channel(`typing:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          callback(payload.new || payload.old)
        }
      )
      .subscribe()

    return subscription
  },

  async getTypingStatus(chatId) {
    const { data, error } = await supabase
      .from('typing_status')
      .select('*, users(username)')
      .eq('chat_id', chatId)
      .eq('is_typing', true)

    if (error) {
      console.error('Error getting typing status:', error)
      return []
    }
    return data
  },
}

// File upload helpers
export const fileHelpers = {
  // Compress image before upload
  async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result

        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`📦 Compressed: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`)
                // Use WebP for 50% smaller file size
                const fileName = file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp')
                resolve(new File([blob], fileName, { type: 'image/webp' }))
              } else {
                reject(new Error('Compression failed'))
              }
            },
            'image/webp', // Changed from 'image/jpeg' for better compression
            quality
          )
        }

        img.onerror = () => reject(new Error('Failed to load image'))
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  },

  async uploadFile(file, chatId) {
    let fileToUpload = file

    // Compress if it's an image
    if (file.type.startsWith('image/')) {
      try {
        fileToUpload = await this.compressImage(file)
      } catch (err) {
        console.warn('Image compression failed, uploading original:', err)
        fileToUpload = file
      }
    }

    const fileExt = fileToUpload.name.split('.').pop()
    const fileName = `${chatId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('chat-files')
      .upload(fileName, fileToUpload)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(fileName)

    return publicUrl
  },

  async uploadVoice(blob, chatId) {
    const fileName = `${chatId}/voice_${Date.now()}.webm`

    const { data, error } = await supabase.storage
      .from('chat-files')
      .upload(fileName, blob)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(fileName)

    return publicUrl
  },
}

