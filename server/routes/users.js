import express from 'express'
import User from '../models/User.js'

const router = express.Router()

// @desc    Get all staff users for the configured company
// @route   GET /api/users/staff
// @access  Public
router.get('/staff', async (req, res) => {
  try {
    // Use company ID from query parameter or environment
    const companyId = req.query.companyId || process.env.COMPANY_ID
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required. Set COMPANY_ID in environment or pass as query parameter.' 
      })
    }

    console.log(`🔍 Fetching staff users for company: ${companyId}`)

    // Build query for staff users only
    const query = { 
      companyId,
      role: 'STAFF',
      isBlocked: false // Only active staff
    }

    // Fetch staff users from MongoDB
    const staffUsers = await User.find(query)
      .select('username name role companyId')
      .sort({ name: 1 })

    console.log(`👥 Found ${staffUsers.length} staff users for company ${companyId}`)
    
    res.json(staffUsers)
  } catch (error) {
    console.error('Error fetching staff users:', error)
    res.status(500).json({ 
      message: 'Error fetching staff users', 
      error: error.message 
    })
  }
})

// @desc    Get all users for the configured company (all roles)
// @route   GET /api/users
// @access  Public
router.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId || process.env.COMPANY_ID
    const { role, limit = 50 } = req.query
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required' 
      })
    }

    console.log(`🔍 Fetching users for company: ${companyId}`)

    // Build query
    const query = { 
      companyId,
      isBlocked: false // Only active users
    }
    
    // Add role filter if provided
    if (role) {
      query.role = role
    }

    // Fetch users from MongoDB
    const users = await User.find(query)
      .select('username name role companyId')
      .sort({ name: 1 })
      .limit(parseInt(limit))

    console.log(`👥 Found ${users.length} users for company ${companyId}`)
    
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    })
  }
})

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username name role companyId isBlocked createdAt updatedAt')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    console.log(`👤 Fetched user details: ${user.name} (${user.username})`)
    
    res.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ 
      message: 'Error fetching user', 
      error: error.message 
    })
  }
})

// Note: This project only reads users from MongoDB
// User creation/updates are handled by a separate project

export default router