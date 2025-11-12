// Connection Manager for optimizing real-time subscriptions
class ConnectionManager {
  constructor() {
    this.connections = new Map()
    this.messageQueue = []
    this.batchSize = 10
    this.batchInterval = 100 // ms
    this.maxConnections = 50
    this.connectionPool = new Set()
    
    // Start batch processing
    this.startBatchProcessor()
    
    // Cleanup inactive connections
    this.startConnectionCleanup()
  }

  /**
   * Get or create a connection for a user
   */
  getConnection(userId, chatId) {
    const connectionKey = `${userId}-${chatId}`
    
    if (this.connections.has(connectionKey)) {
      const connection = this.connections.get(connectionKey)
      connection.lastActivity = Date.now()
      return connection
    }

    // Check connection limit
    if (this.connections.size >= this.maxConnections) {
      this.evictOldestConnection()
    }

    // Create new connection
    const connection = {
      userId,
      chatId,
      connectionKey,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      isActive: true
    }

    this.connections.set(connectionKey, connection)
    console.log(`🔗 New connection: ${connectionKey} (Total: ${this.connections.size})`)
    
    return connection
  }

  /**
   * Queue message for batch processing
   */
  queueMessage(message) {
    this.messageQueue.push({
      ...message,
      timestamp: Date.now()
    })

    // If queue is full, process immediately
    if (this.messageQueue.length >= this.batchSize) {
      this.processBatch()
    }
  }

  /**
   * Process messages in batches for better performance
   */
  processBatch() {
    if (this.messageQueue.length === 0) return

    const batch = this.messageQueue.splice(0, this.batchSize)
    
    // Group messages by chat for efficient processing
    const messagesByChat = new Map()
    
    batch.forEach(message => {
      if (!messagesByChat.has(message.chatId)) {
        messagesByChat.set(message.chatId, [])
      }
      messagesByChat.get(message.chatId).push(message)
    })

    // Process each chat's messages
    messagesByChat.forEach((messages, chatId) => {
      this.processMessagesForChat(chatId, messages)
    })

    console.log(`📦 Processed batch: ${batch.length} messages for ${messagesByChat.size} chats`)
  }

  /**
   * Process messages for a specific chat
   */
  processMessagesForChat(chatId, messages) {
    // Find all connections for this chat
    const chatConnections = Array.from(this.connections.values())
      .filter(conn => conn.chatId === chatId && conn.isActive)

    if (chatConnections.length === 0) return

    // Send messages to all active connections
    chatConnections.forEach(connection => {
      messages.forEach(message => {
        this.deliverMessage(connection, message)
        connection.messageCount++
        connection.lastActivity = Date.now()
      })
    })
  }

  /**
   * Deliver message to a specific connection
   */
  deliverMessage(connection, message) {
    // In a real implementation, this would send via WebSocket
    // For now, we'll just log and update statistics
    console.log(`📨 Delivering message to ${connection.connectionKey}:`, message.content?.substring(0, 50))
  }

  /**
   * Remove inactive connections
   */
  evictOldestConnection() {
    let oldestConnection = null
    let oldestTime = Date.now()

    for (const connection of this.connections.values()) {
      if (connection.lastActivity < oldestTime) {
        oldestTime = connection.lastActivity
        oldestConnection = connection
      }
    }

    if (oldestConnection) {
      this.removeConnection(oldestConnection.connectionKey)
      console.log(`🗑️ Evicted inactive connection: ${oldestConnection.connectionKey}`)
    }
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionKey) {
    const connection = this.connections.get(connectionKey)
    if (connection) {
      connection.isActive = false
      this.connections.delete(connectionKey)
      console.log(`❌ Removed connection: ${connectionKey}`)
    }
  }

  /**
   * Start batch processor
   */
  startBatchProcessor() {
    this.batchProcessor = setInterval(() => {
      this.processBatch()
    }, this.batchInterval)
  }

  /**
   * Start connection cleanup
   */
  startConnectionCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections()
    }, 30000) // Cleanup every 30 seconds
  }

  /**
   * Cleanup inactive connections
   */
  cleanupInactiveConnections() {
    const now = Date.now()
    const inactiveThreshold = 5 * 60 * 1000 // 5 minutes
    let removedCount = 0

    for (const [key, connection] of this.connections.entries()) {
      if (now - connection.lastActivity > inactiveThreshold) {
        this.removeConnection(key)
        removedCount++
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} inactive connections`)
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const connections = Array.from(this.connections.values())
    const now = Date.now()

    return {
      totalConnections: this.connections.size,
      maxConnections: this.maxConnections,
      queuedMessages: this.messageQueue.length,
      averageConnectionAge: connections.length > 0 
        ? connections.reduce((sum, conn) => sum + (now - conn.createdAt), 0) / connections.length / 1000
        : 0,
      totalMessagesProcessed: connections.reduce((sum, conn) => sum + conn.messageCount, 0),
      activeConnections: connections.filter(conn => conn.isActive).length
    }
  }

  /**
   * Destroy connection manager
   */
  destroy() {
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor)
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.connections.clear()
    this.messageQueue.length = 0
  }
}

// Create singleton instance
export const connectionManager = new ConnectionManager()
export default connectionManager