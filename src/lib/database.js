import connectDB, { isMongoAvailable } from './mongodb.js'
import { cached, invalidateCache } from './cache.js'

// Import Supabase helpers for backward compatibility
import { 
  authHelpers as supabaseAuthHelpers, 
  chatHelpers as supabaseChatHelpers,
  messageHelpers as supabaseMessageHelpers,
  typingHelpers as supabaseTypingHelpers,
  fileHelpers as supabaseFileHelpers
} from './supabase.js'

// Initialize MongoDB connection check
let mongoConnected = false
let initPromise = null

// Initialize connection asynchronously
const initMongoDB = async () => {
  if (initPromise) return initPromise
  
  initPromise = connectDB().then((result) => {
    mongoConnected = result.connected
    if (mongoConnected) {
      console.log('✅ MongoDB ready for API integration')
    } else {
      console.log('ℹ️ MongoDB not available, using Supabase only')
    }
    return result
  }).catch((error) => {
    console.warn('⚠️ MongoDB initialization failed:', error.message)
    mongoConnected = false
    return { connected: false, error: error.message }
  })
  
  return initPromise
}

// Start initialization
initMongoDB()

// Hybrid Auth helpers - MongoDB for new features, Supabase for existing chat system
export const authHelpers = {
  // Use Supabase for existing functionality
  ...supabaseAuthHelpers,

  // MongoDB-specific auth methods for new features (API-based)
  async signUpMongo(username, password, phoneNumber = null) {
    if (!isMongoAvailable()) {
      throw new Error('MongoDB API not available')
    }

    try {
      // In a real implementation, this would be an API call to your backend
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          phone_number: phoneNumber
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Signup failed')
      }

      const userData = await response.json()
      return { user: userData }
    } catch (error) {
      // For demo purposes, simulate the operation
      console.log('🔄 Simulating MongoDB user creation:', { username, phoneNumber })
      return { 
        user: { 
          id: `mongo_${Date.now()}`, 
          username, 
          phone_number: phoneNumber,
          is_admin: false,
          created_at: new Date().toISOString()
        } 
      }
    }
  },

  async signInMongo(username, password) {
    if (!isMongoAvailable()) {
      throw new Error('MongoDB API not available')
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign in failed')
      }

      const userData = await response.json()
      return { user: userData, userData }
    } catch (error) {
      // For demo purposes, simulate the operation
      console.log('🔄 Simulating MongoDB user sign in:', username)
      throw new Error('Demo mode: MongoDB sign in not implemented')
    }
  },

  async getUserFromMongo(userId) {
    if (!isMongoAvailable()) {
      return null
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch(`/api/users/${userId}`)
      
      if (!response.ok) {
        return null
      }

      const userData = await response.json()
      return userData
    } catch (error) {
      console.error('Error fetching user from MongoDB API:', error)
      return null
    }
  }
}

// Hybrid Chat helpers - Use Supabase for existing chat system, MongoDB for new features
export const chatHelpers = {
  // Use Supabase for existing chat functionality
  ...supabaseChatHelpers,

  // MongoDB-specific chat methods for new features (API-based)
  async createChatMongo(userId, department) {
    if (!isMongoAvailable()) {
      throw new Error('MongoDB API not available')
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, department })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create chat')
      }

      const chatData = await response.json()
      return chatData
    } catch (error) {
      // For demo purposes, simulate the operation
      console.log('🔄 Simulating MongoDB chat creation:', { userId, department })
      return {
        id: `mongo_chat_${Date.now()}`,
        user_id: userId,
        department,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  },

  async getAllChatsMongo() {
    if (!isMongoAvailable()) {
      return []
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch('/api/chats')
      
      if (!response.ok) {
        console.error('Failed to fetch chats from MongoDB API')
        return []
      }

      const chatsData = await response.json()
      return chatsData
    } catch (error) {
      console.error('Error fetching chats from MongoDB API:', error)
      // For demo purposes, return empty array
      return []
    }
  }
}

// Hybrid Message helpers - Use Supabase for existing chat, MongoDB for new features
export const messageHelpers = {
  // Use Supabase for existing message functionality
  ...supabaseMessageHelpers,

  // MongoDB-specific message methods for new features (API-based)
  async sendMessageMongo(chatId, senderId, senderType, messageType, content, fileUrl = null) {
    if (!isMongoAvailable()) {
      throw new Error('MongoDB API not available')
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          senderId,
          senderType,
          messageType,
          content,
          fileUrl
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send message')
      }

      const messageData = await response.json()
      return messageData
    } catch (error) {
      // For demo purposes, simulate the operation
      console.log('🔄 Simulating MongoDB message send:', { chatId, content })
      return {
        id: `mongo_msg_${Date.now()}`,
        chat_id: chatId,
        sender_id: senderId,
        sender_type: senderType,
        message_type: messageType,
        content,
        file_url: fileUrl,
        created_at: new Date().toISOString()
      }
    }
  },

  async getChatMessagesMongo(chatId) {
    if (!isMongoAvailable()) {
      return []
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch(`/api/chats/${chatId}/messages`)
      
      if (!response.ok) {
        console.error('Failed to fetch messages from MongoDB API')
        return []
      }

      const messagesData = await response.json()
      return messagesData
    } catch (error) {
      console.error('Error getting messages from MongoDB API:', error)
      return []
    }
  }
}

// Hybrid Typing helpers - Use Supabase for existing functionality
export const typingHelpers = {
  // Use Supabase for existing typing functionality
  ...supabaseTypingHelpers,

  // MongoDB-specific typing methods for new features (API-based)
  async setTypingMongo(chatId, userId, isTyping) {
    if (!isMongoAvailable()) {
      return
    }

    try {
      // In a real implementation, this would be an API call
      await fetch('/api/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId, userId, isTyping })
      })
    } catch (error) {
      console.error('Error setting typing status via MongoDB API:', error)
    }
  },

  async getTypingStatusMongo(chatId) {
    if (!isMongoAvailable()) {
      return []
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch(`/api/chats/${chatId}/typing`)
      
      if (!response.ok) {
        return []
      }

      const typingData = await response.json()
      return typingData
    } catch (error) {
      console.error('Error getting typing status from MongoDB API:', error)
      return []
    }
  }
}

// Hybrid File helpers - Use Supabase for existing functionality
export const fileHelpers = {
  // Use Supabase for existing file functionality
  ...supabaseFileHelpers,

  // MongoDB/GridFS methods can be added here for new features
  async uploadFileToMongo(file, chatId) {
    if (!mongoConnected) {
      throw new Error('MongoDB not available')
    }
    
    // This would be implemented with GridFS or cloud storage
    throw new Error('MongoDB file upload not implemented yet')
  }
}

// New User helpers for new MongoDB functionality
export const newUserHelpers = {
  async createNewUser(newUserData) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      console.log('🆔 Creating new client via API:', newUserData)
      
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create new client')
      }

      const result = await response.json()
      console.log('✅ Client created successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Error creating client:', error.message)
      throw error
    }
  },

  async getNewUsers(filters = {}) {
    if (!isMongoAvailable()) {
      return []
    }

    try {
      // In a real implementation, this would be an API call with query params
      const queryParams = new URLSearchParams(filters)
      const response = await fetch(`/api/newusers?${queryParams}`)
      
      if (!response.ok) {
        console.error('Failed to fetch new users from API')
        return []
      }

      const newUsers = await response.json()
      return newUsers
    } catch (error) {
      console.error('Error fetching new users:', error)
      return []
    }
  },

  async updateNewUserStatus(newUserId, status, notes = null) {
    if (!isMongoAvailable()) {
      throw new Error('MongoDB API not available')
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch(`/api/newusers/${newUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update new user status')
      }

      const updatedNewUser = await response.json()
      return updatedNewUser
    } catch (error) {
      console.error('Error updating new user status:', error)
      throw error
    }
  }
}

// Withdrawal helpers for new MongoDB functionality
export const withdrawHelpers = {
  async createWithdrawal(withdrawalData) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      console.log('💸 Creating withdrawal via API:', withdrawalData)
      
      const response = await fetch(`${API_BASE_URL}/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawalData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create withdrawal')
      }

      const result = await response.json()
      console.log('✅ Withdrawal created successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Error creating withdrawal:', error.message)
      throw error
    }
  },

  async getWithdrawals(filters = {}) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
    
    try {
      const params = new URLSearchParams()
      
      if (COMPANY_ID) params.append('companyId', COMPANY_ID)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.bankId) params.append('bankId', filters.bankId)
      if (filters.exchangeId) params.append('exchangeId', filters.exchangeId)
      if (filters.limit) params.append('limit', filters.limit)
      if (filters.page) params.append('page', filters.page)
      
      const response = await fetch(`${API_BASE_URL}/withdrawals?${params}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch withdrawals from API server')
        return { withdrawals: [], pagination: { total: 0 } }
      }

      const result = await response.json()
      console.log(`✅ Loaded ${result.withdrawals.length} withdrawals from MongoDB`)
      return result
    } catch (error) {
      console.warn('API server not available for withdrawals:', error.message)
      return { withdrawals: [], pagination: { total: 0 } }
    }
  },

  async getWithdrawalById(withdrawalId) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE_URL}/withdrawals/${withdrawalId}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch withdrawal details from API server')
        return null
      }

      const withdrawal = await response.json()
      console.log('✅ Loaded withdrawal details from API server')
      return withdrawal
    } catch (error) {
      console.warn('API server not available for withdrawal details:', error.message)
      return null
    }
  },

  async getWithdrawals(filters = {}) {
    if (!isMongoAvailable()) {
      return []
    }

    try {
      // In a real implementation, this would be an API call with query params
      const queryParams = new URLSearchParams(filters)
      const response = await fetch(`/api/withdrawals?${queryParams}`)
      
      if (!response.ok) {
        console.error('Failed to fetch withdrawals from API')
        return []
      }

      const withdrawals = await response.json()
      return withdrawals
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      return []
    }
  },

  async updateWithdrawalStatus(withdrawalId, status, notes = null) {
    if (!isMongoAvailable()) {
      throw new Error('MongoDB API not available')
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch(`/api/withdrawals/${withdrawalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update withdrawal status')
      }

      const updatedWithdrawal = await response.json()
      return updatedWithdrawal
    } catch (error) {
      console.error('Error updating withdrawal status:', error)
      throw error
    }
  }
}

// Deposit helpers for new MongoDB functionality
export const depositHelpers = {
  async createDeposit(depositData) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      console.log('💰 Creating deposit via API:', depositData)
      
      const response = await fetch(`${API_BASE_URL}/deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create deposit')
      }

      const result = await response.json()
      console.log('✅ Deposit created successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Error creating deposit:', error.message)
      throw error
    }
  },

  async getDeposits(filters = {}) {
    if (!isMongoAvailable()) {
      return []
    }

    try {
      // In a real implementation, this would be an API call with query params
      const queryParams = new URLSearchParams(filters)
      const response = await fetch(`/api/deposits?${queryParams}`)
      
      if (!response.ok) {
        console.error('Failed to fetch deposits from API')
        return []
      }

      const deposits = await response.json()
      return deposits
    } catch (error) {
      console.error('Error fetching deposits:', error)
      return []
    }
  },

  async updateDepositStatus(depositId, status, notes = null) {
    if (!isMongoAvailable()) {
      throw new Error('MongoDB API not available')
    }

    try {
      // In a real implementation, this would be an API call
      const response = await fetch(`/api/deposits/${depositId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update deposit status')
      }

      const updatedDeposit = await response.json()
      return updatedDeposit
    } catch (error) {
      console.error('Error updating deposit status:', error)
      throw error
    }
  }
}

// Bank helpers for fetching bank data from MongoDB via API server
export const bankHelpers = {
  async getBanks() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
    
    try {
      // Always filter by company ID from environment
      const queryParams = COMPANY_ID ? `?companyId=${COMPANY_ID}` : ''
      const response = await fetch(`${API_BASE_URL}/banks${queryParams}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch banks from API server, using fallback data')
        return this.getFallbackBanks()
      }

      const banks = await response.json()
      console.log(`✅ Loaded ${banks.length} banks for company ${COMPANY_ID} from MongoDB`)
      return banks
    } catch (error) {
      console.warn('API server not available, using fallback bank data:', error.message)
      return this.getFallbackBanks()
    }
  },

  // Fallback bank data if API is not available
  getFallbackBanks() {
    console.log('🔄 Using fallback bank data')
    
    return [
      { _id: 'hbl', name: 'HBL Bank', currentAmount: 0 },
      { _id: 'ubl', name: 'UBL Bank', currentAmount: 0 },
      { _id: 'mcb', name: 'MCB Bank', currentAmount: 0 },
      { _id: 'allied', name: 'Allied Bank', currentAmount: 0 },
      { _id: 'nbp', name: 'National Bank', currentAmount: 0 },
      { _id: 'js', name: 'JS Bank', currentAmount: 0 },
      { _id: 'meezan', name: 'Meezan Bank', currentAmount: 0 },
      { _id: 'askari', name: 'Askari Bank', currentAmount: 0 }
    ]
  },

  // Get detailed bank information
  async getBankById(bankId) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE_URL}/banks/${bankId}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch bank details from API server')
        return null
      }

      const bank = await response.json()
      console.log('✅ Loaded bank details from API server:', bank.name)
      return bank
    } catch (error) {
      console.warn('API server not available for bank details:', error.message)
      return null
    }
  }
}

// Client helpers for fetching client data from MongoDB via API server
export const clientHelpers = {
  async getClients(searchQuery = '', exchangeId = null) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
    
    try {
      let url = `${API_BASE_URL}/clients`
      const params = new URLSearchParams()
      
      if (COMPANY_ID) params.append('companyId', COMPANY_ID)
      if (searchQuery) params.append('search', searchQuery)
      if (exchangeId) params.append('exchangeId', exchangeId)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn('Failed to fetch clients from API server, using fallback data')
        return this.getFallbackClients()
      }

      const clients = await response.json()
      console.log(`✅ Loaded ${clients.length} clients for company ${COMPANY_ID} from MongoDB`)
      return clients
    } catch (error) {
      console.warn('API server not available, using fallback client data:', error.message)
      return this.getFallbackClients()
    }
  },

  async searchClients(query) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
    
    if (!query || query.trim().length < 1) {
      return []
    }
    
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        companyId: COMPANY_ID
      })
      
      const response = await fetch(`${API_BASE_URL}/clients/search?${params}`)
      
      if (!response.ok) {
        console.warn('Failed to search clients from API server')
        return this.getFallbackClients().filter(client => 
          client.name.toLowerCase().includes(query.toLowerCase()) ||
          client.clientId.toLowerCase().includes(query.toLowerCase()) ||
          client.userId.toLowerCase().includes(query.toLowerCase()) ||
          (client.phoneNumber && client.phoneNumber.includes(query))
        )
      }

      const clients = await response.json()
      console.log(`🔍 Found ${clients.length} clients matching "${query}" (clientId prioritized)`)
      return clients
    } catch (error) {
      console.warn('API server not available for client search:', error.message)
      return this.getFallbackClients().filter(client => 
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        client.clientId.toLowerCase().includes(query.toLowerCase())
      )
    }
  },

  // Fallback client data if API is not available
  getFallbackClients() {
    console.log('🔄 Using fallback client data')
    
    return [
      { _id: 'CLI001', name: 'John Doe', clientId: 'CLI001', userId: 'john_doe', phoneNumber: '+92300123456', exchangeName: 'Binance' },
      { _id: 'CLI002', name: 'Jane Smith', clientId: 'CLI002', userId: 'jane_smith', phoneNumber: '+92301234567', exchangeName: 'Bybit' },
      { _id: 'CLI003', name: 'Ahmed Ali', clientId: 'CLI003', userId: 'ahmed_ali', phoneNumber: '+92302345678', exchangeName: 'OKX' },
      { _id: 'CLI004', name: 'Sara Khan', clientId: 'CLI004', userId: 'sara_khan', phoneNumber: '+92303456789', exchangeName: 'KuCoin' },
      { _id: 'CLI005', name: 'Hassan Malik', clientId: 'CLI005', userId: 'hassan_malik', phoneNumber: '+92304567890', exchangeName: 'Gate.io' }
    ]
  },

  // Get detailed client information
  async getClientById(clientId) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch client details from API server')
        return null
      }

      const client = await response.json()
      console.log('✅ Loaded client details from API server:', client.name)
      return client
    } catch (error) {
      console.warn('API server not available for client details:', error.message)
      return null
    }
  }
}

// User helpers for fetching staff user data from MongoDB via API server
export const userHelpers = {
  async getStaffUsers() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
    
    try {
      // Always filter by company ID from environment
      const queryParams = COMPANY_ID ? `?companyId=${COMPANY_ID}` : ''
      const response = await fetch(`${API_BASE_URL}/users/staff${queryParams}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch staff users from API server, using fallback data')
        return this.getFallbackStaffUsers()
      }

      const staffUsers = await response.json()
      console.log(`✅ Loaded ${staffUsers.length} staff users for company ${COMPANY_ID} from MongoDB`)
      return staffUsers
    } catch (error) {
      console.warn('API server not available, using fallback staff user data:', error.message)
      return this.getFallbackStaffUsers()
    }
  },

  async getAllUsers(role = null) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
    
    try {
      let url = `${API_BASE_URL}/users`
      const params = new URLSearchParams()
      
      if (COMPANY_ID) params.append('companyId', COMPANY_ID)
      if (role) params.append('role', role)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn('Failed to fetch users from API server')
        return []
      }

      const users = await response.json()
      console.log(`✅ Loaded ${users.length} users for company ${COMPANY_ID} from MongoDB`)
      return users
    } catch (error) {
      console.warn('API server not available for user data:', error.message)
      return []
    }
  },

  // Fallback staff user data if API is not available
  getFallbackStaffUsers() {
    console.log('🔄 Using fallback staff user data')
    
    return [
      { _id: 'staff001', username: 'staff_john', name: 'John Staff', role: 'STAFF' },
      { _id: 'staff002', username: 'staff_jane', name: 'Jane Staff', role: 'STAFF' },
      { _id: 'staff003', username: 'staff_ahmed', name: 'Ahmed Staff', role: 'STAFF' },
      { _id: 'staff004', username: 'staff_sara', name: 'Sara Staff', role: 'STAFF' },
      { _id: 'staff005', username: 'staff_hassan', name: 'Hassan Staff', role: 'STAFF' }
    ]
  },

  // Get detailed user information
  async getUserById(userId) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch user details from API server')
        return null
      }

      const user = await response.json()
      console.log('✅ Loaded user details from API server:', user.name)
      return user
    } catch (error) {
      console.warn('API server not available for user details:', error.message)
      return null
    }
  }
}

// Exchange helpers for fetching exchange data from MongoDB via API server
export const exchangeHelpers = {
  async getExchanges() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
    
    try {
      // Always filter by company ID from environment
      const queryParams = COMPANY_ID ? `?companyId=${COMPANY_ID}` : ''
      const response = await fetch(`${API_BASE_URL}/exchanges${queryParams}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch exchanges from API server, using simulated data')
        return this.getSimulatedExchanges()
      }

      const exchanges = await response.json()
      console.log(`✅ Loaded ${exchanges.length} exchanges for company ${COMPANY_ID} from MongoDB`)
      return exchanges
    } catch (error) {
      console.warn('API server not available, using simulated exchange data:', error.message)
      return this.getSimulatedExchanges()
    }
  },

  // Simulate MongoDB Exchange data based on your model
  getSimulatedExchanges() {
    console.log('🔄 Simulating MongoDB Exchange data for company')
    
    const COMPANY_ID = import.meta.env.VITE_COMPANY_ID || '6911b5596b7b9676d53ed1d5'
    
    // Simulate realistic exchange data that matches your Exchange model
    const simulatedExchanges = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Binance',
        currentAmount: 125000.50,
        companyId: COMPANY_ID,
        clients: ['507f1f77bcf86cd799439021', '507f1f77bcf86cd799439022'],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 50000,
            previousBalance: 75000.50,
            newBalance: 125000.50,
            performedBy: '507f1f77bcf86cd799439031',
            performedByName: 'Admin User',
            note: 'Initial funding',
            createdAt: new Date('2024-01-15T10:30:00Z')
          }
        ],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Bybit',
        currentAmount: 87500.25,
        companyId: COMPANY_ID,
        clients: ['507f1f77bcf86cd799439023', '507f1f77bcf86cd799439024'],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 30000,
            previousBalance: 57500.25,
            newBalance: 87500.25,
            performedBy: '507f1f77bcf86cd799439031',
            performedByName: 'Admin User',
            note: 'Monthly funding',
            createdAt: new Date('2024-01-10T14:20:00Z')
          }
        ],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-10T14:20:00Z')
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'OKX',
        currentAmount: 95750.75,
        companyId: COMPANY_ID,
        clients: ['507f1f77bcf86cd799439025'],
        transactions: [],
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z')
      },
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'KuCoin',
        currentAmount: 62300.00,
        companyId: COMPANY_ID,
        clients: ['507f1f77bcf86cd799439026', '507f1f77bcf86cd799439027'],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 25000,
            previousBalance: 37300.00,
            newBalance: 62300.00,
            performedBy: '507f1f77bcf86cd799439031',
            performedByName: 'Admin User',
            note: 'Weekly funding',
            createdAt: new Date('2024-01-08T09:15:00Z')
          }
        ],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-08T09:15:00Z')
      },
      {
        _id: '507f1f77bcf86cd799439015',
        name: 'Gate.io',
        currentAmount: 43200.80,
        companyId: COMPANY_ID,
        clients: ['507f1f77bcf86cd799439028'],
        transactions: [],
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-03T00:00:00Z')
      },
      {
        _id: '507f1f77bcf86cd799439016',
        name: 'Huobi',
        currentAmount: 78900.45,
        companyId: COMPANY_ID,
        clients: ['507f1f77bcf86cd799439029', '507f1f77bcf86cd799439030'],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 40000,
            previousBalance: 38900.45,
            newBalance: 78900.45,
            performedBy: '507f1f77bcf86cd799439031',
            performedByName: 'Admin User',
            note: 'Quarterly funding',
            createdAt: new Date('2024-01-12T16:45:00Z')
          }
        ],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-12T16:45:00Z')
      }
    ]

    // Return simplified format for dropdown usage
    return simulatedExchanges.map(exchange => ({
      _id: exchange._id,
      name: exchange.name,
      currentAmount: exchange.currentAmount,
      companyId: exchange.companyId,
      clientCount: exchange.clients.length
    }))
  },

  // Get detailed exchange information
  async getExchangeById(exchangeId) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    try {
      const response = await fetch(`${API_BASE_URL}/exchanges/${exchangeId}`)
      
      if (!response.ok) {
        console.warn('Failed to fetch exchange details from API server')
        // Find in simulated data
        const simulatedExchanges = this.getSimulatedExchanges()
        return simulatedExchanges.find(ex => ex._id === exchangeId) || null
      }

      const exchange = await response.json()
      console.log('✅ Loaded exchange details from API server:', exchange.name)
      return exchange
    } catch (error) {
      console.warn('API server not available for exchange details:', error.message)
      // Find in simulated data
      const simulatedExchanges = this.getSimulatedExchanges()
      return simulatedExchanges.find(ex => ex._id === exchangeId) || null
    }
  },


}

// Export MongoDB connection status for other modules
export const mongoStatus = {
  isConnected: () => mongoConnected,
  isAvailable: () => isMongoAvailable(),
  getStatus: async () => {
    await initMongoDB()
    return {
      connected: mongoConnected,
      available: isMongoAvailable(),
      uri: import.meta.env.VITE_MONGODB_URI ? 'Configured' : 'Not configured'
    }
  }
}