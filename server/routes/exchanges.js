import express from 'express'
import Exchange from '../models/Exchange.js'

const router = express.Router()

// @desc    Get all exchanges for the configured company
// @route   GET /api/exchanges
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Use company ID from query parameter or environment
    const companyId = req.query.companyId || process.env.COMPANY_ID
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required. Set COMPANY_ID in environment or pass as query parameter.' 
      })
    }

    console.log(`🔍 Fetching exchanges for company: ${companyId}`)

    // Fetch exchanges from MongoDB for specific company
    const exchanges = await Exchange.find({ companyId })
      .select('name currentAmount companyId clients')
      .sort({ name: 1 })

    // Format response for frontend
    const formattedExchanges = exchanges.map(exchange => ({
      _id: exchange._id,
      name: exchange.name,
      currentAmount: exchange.currentAmount,
      companyId: exchange.companyId,
      clientCount: exchange.clients.length
    }))

    console.log(`📊 Found ${formattedExchanges.length} exchanges for company ${companyId}`)
    
    res.json(formattedExchanges)
  } catch (error) {
    console.error('Error fetching exchanges:', error)
    res.status(500).json({ 
      message: 'Error fetching exchanges', 
      error: error.message 
    })
  }
})

// @desc    Get single exchange by ID
// @route   GET /api/exchanges/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const exchange = await Exchange.findById(req.params.id)

    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found' })
    }

    // Format response
    const formattedExchange = {
      _id: exchange._id,
      name: exchange.name,
      currentAmount: exchange.currentAmount,
      companyId: exchange.companyId,
      clients: exchange.clients,
      clientCount: exchange.clients.length,
      transactions: exchange.transactions,
      createdAt: exchange.createdAt,
      updatedAt: exchange.updatedAt
    }

    console.log(`📊 Fetched exchange details: ${exchange.name}`)
    
    res.json(formattedExchange)
  } catch (error) {
    console.error('Error fetching exchange:', error)
    res.status(500).json({ 
      message: 'Error fetching exchange', 
      error: error.message 
    })
  }
})

// Note: This project only reads exchanges from MongoDB
// Exchange creation/updates are handled by a separate project

export default router