import express from 'express'
import Client from '../models/Client.js'

const router = express.Router()

// @desc    Get all clients for the configured company
// @route   GET /api/clients
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Use company ID from query parameter or environment
    const companyId = req.query.companyId || process.env.COMPANY_ID
    const { search, exchangeId, limit = 50 } = req.query
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required. Set COMPANY_ID in environment or pass as query parameter.' 
      })
    }

    console.log(`🔍 Fetching clients for company: ${companyId}`)

    // Build query
    const query = { companyId }
    
    // Add exchange filter if provided
    if (exchangeId) {
      query.exchangeId = exchangeId
    }

    // Add search functionality with clientId priority
    if (search) {
      query.$or = [
        { clientId: { $regex: search, $options: 'i' } }, // Highest priority
        { name: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ]
    }

    // Fetch clients from MongoDB
    const clients = await Client.find(query)
      .populate('exchangeId', 'name')
      .select('name userId clientId phoneNumber exchangeId')
      .sort({ name: 1 })
      .limit(parseInt(limit))

    // Format response for frontend
    const formattedClients = clients.map(client => ({
      _id: client._id,
      name: client.name,
      userId: client.userId,
      clientId: client.clientId,
      phoneNumber: client.phoneNumber,
      exchangeId: client.exchangeId._id,
      exchangeName: client.exchangeId.name
    }))

    console.log(`👥 Found ${formattedClients.length} clients for company ${companyId}`)
    
    res.json(formattedClients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    res.status(500).json({ 
      message: 'Error fetching clients', 
      error: error.message 
    })
  }
})

// @desc    Search clients with priority on clientId
// @route   GET /api/clients/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const companyId = req.query.companyId || process.env.COMPANY_ID
    const { q, limit = 20 } = req.query
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required' 
      })
    }

    if (!q || q.trim().length < 1) {
      return res.json([])
    }

    const searchTerm = q.trim()
    console.log(`🔍 Searching clients for: "${searchTerm}" (prioritizing clientId)`)

    let allClients = []

    // 1. First priority: Exact clientId match
    const exactClientIdMatch = await Client.find({
      companyId,
      clientId: { $regex: `^${searchTerm}$`, $options: 'i' }
    })
    .populate('exchangeId', 'name')
    .select('name userId clientId phoneNumber exchangeId')
    .limit(5)

    allClients = [...exactClientIdMatch]

    // 2. Second priority: clientId starts with search term
    if (allClients.length < parseInt(limit)) {
      const clientIdStartsWith = await Client.find({
        companyId,
        clientId: { 
          $regex: `^${searchTerm}`, 
          $options: 'i',
          $not: { $regex: `^${searchTerm}$`, $options: 'i' } // Exclude exact matches already found
        }
      })
      .populate('exchangeId', 'name')
      .select('name userId clientId phoneNumber exchangeId')
      .sort({ clientId: 1 })
      .limit(parseInt(limit) - allClients.length)

      allClients = [...allClients, ...clientIdStartsWith]
    }

    // 3. Third priority: clientId contains search term (partial match)
    if (allClients.length < parseInt(limit)) {
      const existingClientIds = allClients.map(c => c._id.toString())
      
      const clientIdContains = await Client.find({
        companyId,
        _id: { $nin: existingClientIds }, // Exclude already found clients
        clientId: { $regex: searchTerm, $options: 'i' }
      })
      .populate('exchangeId', 'name')
      .select('name userId clientId phoneNumber exchangeId')
      .sort({ clientId: 1 })
      .limit(parseInt(limit) - allClients.length)

      allClients = [...allClients, ...clientIdContains]
    }

    // 4. Fourth priority: Other fields (name, userId, phone)
    if (allClients.length < parseInt(limit)) {
      const existingClientIds = allClients.map(c => c._id.toString())
      
      const otherFieldMatches = await Client.find({
        companyId,
        _id: { $nin: existingClientIds }, // Exclude already found clients
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { userId: { $regex: searchTerm, $options: 'i' } },
          { phoneNumber: { $regex: searchTerm, $options: 'i' } }
        ]
      })
      .populate('exchangeId', 'name')
      .select('name userId clientId phoneNumber exchangeId')
      .sort({ name: 1 })
      .limit(parseInt(limit) - allClients.length)

      allClients = [...allClients, ...otherFieldMatches]
    }

    // Format response
    const formattedClients = allClients.map(client => ({
      _id: client._id,
      name: client.name,
      userId: client.userId,
      clientId: client.clientId,
      phoneNumber: client.phoneNumber,
      exchangeId: client.exchangeId._id,
      exchangeName: client.exchangeId.name
    }))

    console.log(`👥 Found ${formattedClients.length} clients matching "${searchTerm}" (clientId prioritized)`)
    
    res.json(formattedClients)
  } catch (error) {
    console.error('Error searching clients:', error)
    res.status(500).json({ 
      message: 'Error searching clients', 
      error: error.message 
    })
  }
})

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('exchangeId', 'name currentAmount')

    if (!client) {
      return res.status(404).json({ message: 'Client not found' })
    }

    // Format response
    const formattedClient = {
      _id: client._id,
      name: client.name,
      userId: client.userId,
      clientId: client.clientId,
      phoneNumber: client.phoneNumber,
      exchangeId: client.exchangeId._id,
      exchangeName: client.exchangeId.name,
      exchangeBalance: client.exchangeId.currentAmount,
      companyId: client.companyId,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }

    console.log(`👤 Fetched client details: ${client.name} (${client.clientId})`)
    
    res.json(formattedClient)
  } catch (error) {
    console.error('Error fetching client:', error)
    res.status(500).json({ 
      message: 'Error fetching client', 
      error: error.message 
    })
  }
})

// @desc    Create a new client
// @route   POST /api/clients
// @access  Public
router.post('/', async (req, res) => {
  try {
    let { name, userId, clientId, phoneNumber, exchangeId, staffUserId } = req.body

    // Use company ID from environment
    const companyId = process.env.COMPANY_ID
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required. Set COMPANY_ID in environment.' 
      })
    }

    // Validate required fields
    if (!name || !userId || !exchangeId || !staffUserId) {
      return res.status(400).json({ 
        message: 'Name, user ID, exchange, and staff user are required' 
      })
    }

    console.log(`🆔 Creating new client: ${name} (${userId}) for exchange ${exchangeId}`)

    // Import Exchange and User models
    const Exchange = (await import('../models/Exchange.js')).default
    const User = (await import('../models/User.js')).default

    // Verify exchange exists and belongs to the company
    const exchange = await Exchange.findOne({
      _id: exchangeId,
      companyId: companyId
    })

    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found or does not belong to your company' })
    }

    // Verify staff user exists and is authorized
    const staffUser = await User.findOne({ 
      _id: staffUserId, 
      companyId: companyId, 
      role: 'STAFF', 
      isBlocked: false 
    })

    if (!staffUser) {
      return res.status(404).json({ message: 'Staff user not found or not authorized' })
    }

    // Auto-generate clientId if not provided
    if (!clientId) {
      // Find the highest clientId number for this company
      const clients = await Client.find({ companyId }).select('clientId').sort({ clientId: -1 })
      
      let nextNumber = 1
      if (clients.length > 0) {
        // Extract numbers from clientIds that match the pattern CL###
        const numbers = clients.map(client => {
          const match = client.clientId.match(/^CL(\d+)$/)
          return match ? parseInt(match[1], 10) : 0
        }).filter(num => num > 0)

        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1
        }
      }

      // Format as CL001, CL002, etc.
      clientId = `CL${nextNumber.toString().padStart(3, '0')}`
    }

    // Check if clientId already exists for this company
    const existingClientId = await Client.findOne({
      clientId: clientId.toUpperCase(),
      companyId: companyId
    })

    if (existingClientId) {
      return res.status(400).json({ 
        message: 'A client with this Client ID already exists in your company' 
      })
    }

    // Check if userId already exists for this exchange
    const existingClient = await Client.findOne({
      userId,
      exchangeId,
      companyId: companyId
    })

    if (existingClient) {
      return res.status(400).json({ 
        message: 'A client with this user ID already exists for this exchange' 
      })
    }

    console.log(`📱 Phone number: ${phoneNumber}`)

    // Create the client
    const client = await Client.create({
      name,
      userId,
      clientId: clientId.toUpperCase(),
      phoneNumber: phoneNumber || undefined,
      exchangeId,
      companyId
    })

    console.log('✅ Client created:', client)

    // Populate the created client for response
    const populatedClient = await Client.findById(client._id)
      .populate('exchangeId', 'name')

    // Add client to exchange's clients array (if the field exists)
    try {
      await Exchange.findByIdAndUpdate(exchangeId, {
        $addToSet: { clients: client._id }
      })
      console.log('✅ Added client to exchange clients array')
    } catch (error) {
      console.log('ℹ️ Exchange clients array not available, skipping update')
    }

    console.log(`✅ Client created successfully: ${name} (${clientId})`)

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: populatedClient
    })

  } catch (error) {
    console.error('Error creating client:', error)
    
    if (error.code === 11000) {
      if (error.keyPattern?.clientId) {
        return res.status(400).json({ 
          message: 'A client with this Client ID already exists in your company' 
        })
      }
      return res.status(400).json({ 
        message: 'A client with this user ID already exists for this exchange' 
      })
    }
    
    res.status(500).json({ 
      message: 'Error creating client', 
      error: error.message 
    })
  }
})

export default router