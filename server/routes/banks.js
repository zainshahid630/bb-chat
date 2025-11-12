import express from 'express'
import Bank from '../models/Bank.js'

const router = express.Router()

// @desc    Get all banks for the configured company
// @route   GET /api/banks
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

    console.log(`🔍 Fetching banks for company: ${companyId}`)

    // Fetch banks from MongoDB for specific company
    const banks = await Bank.find({ companyId })
      .select('name currentAmount companyId')
      .sort({ name: 1 })

    // Format response for frontend
    const formattedBanks = banks.map(bank => ({
      _id: bank._id,
      name: bank.name,
      currentAmount: bank.currentAmount,
      companyId: bank.companyId
    }))

    console.log(`🏦 Found ${formattedBanks.length} banks for company ${companyId}`)
    
    res.json(formattedBanks)
  } catch (error) {
    console.error('Error fetching banks:', error)
    res.status(500).json({ 
      message: 'Error fetching banks', 
      error: error.message 
    })
  }
})

// @desc    Get single bank by ID
// @route   GET /api/banks/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id)

    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' })
    }

    // Format response
    const formattedBank = {
      _id: bank._id,
      name: bank.name,
      currentAmount: bank.currentAmount,
      companyId: bank.companyId,
      transactions: bank.transactions,
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt
    }

    console.log(`🏦 Fetched bank details: ${bank.name}`)
    
    res.json(formattedBank)
  } catch (error) {
    console.error('Error fetching bank:', error)
    res.status(500).json({ 
      message: 'Error fetching bank', 
      error: error.message 
    })
  }
})

// Note: This project only reads banks from MongoDB
// Bank creation/updates are handled by a separate project

export default router