import { supabase } from './supabase'

/**
 * Centralized WebSocket connection manager
 * Reduces connection overhead by reusing a single channel
 */
class RealtimeManager {
  constructor() {
    this.subscriptions = new Map()
    this.channel = null
    this.isConnected = false
  }

  /**
   * Subscribe to messages for a specific chat
   * Reuses single WebSocket connection for all chats
   */
  subscribe(chatId, callback) {
    console.log('📡 Subscribing to chat:', chatId)
    
    // Store callback
    this.subscriptions.set(chatId, callback)
    
    // Create channel if first subscription
    if (!this.channel) {
      this.initializeChannel()
    }

    // Return unsubscribe function
    return () => this.unsubscribe(chatId)
  }

  initializeChannel() {
    console.log('🔌 Initializing shared realtime channel')
    
    this.channel = supabase
      .channel('all-messages-shared')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const chatId = payload.new.chat_id
          const callback = this.subscriptions.get(chatId)
          
          if (callback) {
            console.log('📨 Message received for chat:', chatId)
            callback(payload.new, 'insert')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const chatId = payload.new.chat_id
          const callback = this.subscriptions.get(chatId)
          
          if (callback) {
            console.log('🔄 Message updated for chat:', chatId)
            callback(payload.new, 'update')
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Channel status:', status)
        this.isConnected = status === 'SUBSCRIBED'
      })
  }

  unsubscribe(chatId) {
    console.log('📡 Unsubscribing from chat:', chatId)
    this.subscriptions.delete(chatId)
    
    // Close channel if no more subscriptions
    if (this.subscriptions.size === 0 && this.channel) {
      console.log('🔌 Closing shared realtime channel')
      this.channel.unsubscribe()
      this.channel = null
      this.isConnected = false
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      activeSubscriptions: this.subscriptions.size,
    }
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager()
