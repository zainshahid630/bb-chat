import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  try {
    // Optimized connection options for high concurrency
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection Pool Settings for High Concurrency
      maxPoolSize: 50, // Maximum number of connections in the pool
      minPoolSize: 5,  // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a send or receive on a socket can take
      
      // Performance Optimizations (Mongoose 6+ compatible)
      bufferCommands: false, // Disable mongoose buffering for better error handling
      
      // Retry Logic
      retryWrites: true,
      retryReads: true,
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    console.log(`📊 Database: ${conn.connection.name}`)
    console.log(`🔗 Connection Pool: Max ${conn.connection.options?.maxPoolSize || 'default'}, Min ${conn.connection.options?.minPoolSize || 'default'}`)
    
    // Connection event listeners for monitoring
    conn.connection.on('connected', () => {
      console.log('🟢 MongoDB connection established')
    })
    
    conn.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err)
    })
    
    conn.connection.on('disconnected', () => {
      console.log('🟡 MongoDB disconnected')
    })
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await conn.connection.close()
      console.log('🔴 MongoDB connection closed through app termination')
      process.exit(0)
    })
    
    return conn
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    process.exit(1)
  }
}

export default connectDB