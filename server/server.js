import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import connectDB from './config/database.js'
import exchangeRoutes from './routes/exchanges.js'
import bankRoutes from './routes/banks.js'
import clientRoutes from './routes/clients.js'
import userRoutes from './routes/users.js'
import depositRoutes from './routes/deposits.js'
import withdrawalRoutes from './routes/withdrawals.js'
import { performanceMonitor } from './middleware/performance.js'

// Load environment variables
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()
const PORT = process.env.PORT || 3003

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter rate limiting for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Too many requests, please slow down.',
  },
})

// Performance Middleware
app.use(compression()) // Compress responses
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow file uploads
  contentSecurityPolicy: false, // Allow inline scripts for development
}))
app.use(morgan('combined'))
// Allow calls from everywhere
app.use(cors({
  origin: '*', // Allow all origins
  credentials: false, // Set to false when using wildcard origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter)

// Performance monitoring
app.use(performanceMonitor.requestTimer())

// Body parsing with size limits
app.use(express.json({ limit: '10mb' })) // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes with specific rate limiting for sensitive operations
app.use('/api/exchanges', exchangeRoutes)
app.use('/api/banks', bankRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/users', userRoutes)
app.use('/api/deposits', strictLimiter, depositRoutes) // Stricter limit for financial operations
app.use('/api/withdrawals', strictLimiter, withdrawalRoutes) // Stricter limit for financial operations

// Health check endpoint with performance stats
app.get('/api/health', (req, res) => {
  const stats = performanceMonitor.getStats()
  
  res.json({ 
    status: 'OK', 
    message: 'Chat Backend API Server is running',
    timestamp: new Date().toISOString(),
    mongodb: 'Connected',
    performance: stats
  })
})

// Performance stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = performanceMonitor.getStats()
  res.json(stats)
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat Backend API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      exchanges: '/api/exchanges',
      banks: '/api/banks',
      clients: '/api/clients',
      users: '/api/users',
      deposits: '/api/deposits',
      withdrawals: '/api/withdrawals'
    }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/exchanges',
      'GET /api/exchanges/:id',
      'GET /api/banks',
      'GET /api/banks/:id',
      'GET /api/clients',
      'GET /api/clients/search',
      'GET /api/clients/:id',
      'POST /api/clients',
      'GET /api/users',
      'GET /api/users/staff',
      'GET /api/users/:id',
      'POST /api/deposits',
      'GET /api/deposits',
      'GET /api/deposits/:id',
      'POST /api/withdrawals',
      'GET /api/withdrawals',
      'GET /api/withdrawals/:id'
    ]
  })
})

// Error handler with performance tracking
app.use(performanceMonitor.errorTracker())

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`)
  console.log(`💱 Exchanges API: http://localhost:${PORT}/api/exchanges`)
})