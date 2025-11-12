// Database optimization script - Create indexes for better performance
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const createOptimizedIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('📊 Connected to MongoDB for index creation')

    const db = mongoose.connection.db

    // Client Collection Indexes
    console.log('🔍 Creating Client indexes...')
    await db.collection('clients').createIndex({ companyId: 1, clientId: 1 }, { unique: true })
    await db.collection('clients').createIndex({ companyId: 1, userId: 1, exchangeId: 1 }, { unique: true })
    await db.collection('clients').createIndex({ companyId: 1, name: 1 })
    await db.collection('clients').createIndex({ companyId: 1, phoneNumber: 1 })
    await db.collection('clients').createIndex({ exchangeId: 1 })
    await db.collection('clients').createIndex({ createdAt: -1 })

    // User Collection Indexes
    console.log('🔍 Creating User indexes...')
    await db.collection('users').createIndex({ username: 1 }, { unique: true })
    await db.collection('users').createIndex({ companyId: 1, role: 1 })
    await db.collection('users').createIndex({ companyId: 1, isBlocked: 1 })
    await db.collection('users').createIndex({ role: 1, isBlocked: 1 })

    // Exchange Collection Indexes
    console.log('🔍 Creating Exchange indexes...')
    await db.collection('exchanges').createIndex({ companyId: 1, name: 1 })
    await db.collection('exchanges').createIndex({ companyId: 1, currentAmount: -1 })
    await db.collection('exchanges').createIndex({ createdAt: -1 })

    // Bank Collection Indexes
    console.log('🔍 Creating Bank indexes...')
    await db.collection('banks').createIndex({ companyId: 1, name: 1 })
    await db.collection('banks').createIndex({ companyId: 1, currentAmount: -1 })
    await db.collection('banks').createIndex({ createdAt: -1 })

    // Deposit Collection Indexes
    console.log('🔍 Creating Deposit indexes...')
    await db.collection('deposits').createIndex({ companyId: 1, date: -1 })
    await db.collection('deposits').createIndex({ companyId: 1, clientId: 1, date: -1 })
    await db.collection('deposits').createIndex({ companyId: 1, bankId: 1, date: -1 })
    await db.collection('deposits').createIndex({ companyId: 1, exchangeId: 1, date: -1 })
    await db.collection('deposits').createIndex({ companyId: 1, createdBy: 1, date: -1 })
    await db.collection('deposits').createIndex({ companyId: 1, isVerified: 1, isRejected: 1 })
    await db.collection('deposits').createIndex({ referenceNumber: 1 }, { unique: true, sparse: true })
    await db.collection('deposits').createIndex({ createdAt: -1 })

    // Withdrawal Collection Indexes
    console.log('🔍 Creating Withdrawal indexes...')
    await db.collection('withdrawals').createIndex({ companyId: 1, date: -1 })
    await db.collection('withdrawals').createIndex({ companyId: 1, clientId: 1, date: -1 })
    await db.collection('withdrawals').createIndex({ companyId: 1, bankId: 1, date: -1 })
    await db.collection('withdrawals').createIndex({ companyId: 1, exchangeId: 1, date: -1 })
    await db.collection('withdrawals').createIndex({ companyId: 1, createdBy: 1, date: -1 })
    await db.collection('withdrawals').createIndex({ companyId: 1, isVerified: 1, isRejected: 1 })
    await db.collection('withdrawals').createIndex({ referenceNumber: 1 }, { unique: true, sparse: true })
    await db.collection('withdrawals').createIndex({ createdAt: -1 })

    // Compound indexes for common queries
    console.log('🔍 Creating compound indexes...')
    await db.collection('deposits').createIndex({ 
      companyId: 1, 
      isVerified: 1, 
      isRejected: 1, 
      createdAt: -1 
    })
    
    await db.collection('withdrawals').createIndex({ 
      companyId: 1, 
      isVerified: 1, 
      isRejected: 1, 
      createdAt: -1 
    })

    // Text indexes for search functionality
    console.log('🔍 Creating text search indexes...')
    await db.collection('clients').createIndex({
      name: 'text',
      clientId: 'text',
      userId: 'text'
    })

    console.log('✅ All indexes created successfully!')

    // Show index statistics
    const collections = ['clients', 'users', 'exchanges', 'banks', 'deposits', 'withdrawals']
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes()
      console.log(`📊 ${collectionName} indexes:`, indexes.length)
    }

  } catch (error) {
    console.error('❌ Error creating indexes:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Always run when script is executed
createOptimizedIndexes().catch(console.error)

export default createOptimizedIndexes