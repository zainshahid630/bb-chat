import express from 'express'
import mongoose from 'mongoose'
import Withdrawal from '../models/Withdrawal.js'
import Bank from '../models/Bank.js'
import Client from '../models/Client.js'
import Exchange from '../models/Exchange.js'
import User from '../models/User.js'

const router = express.Router()

// @desc    Create a new withdrawal
// @route   POST /api/withdrawals
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      date,
      bank: bankId,
      clientId,
      exchange: exchangeId,
      amount,
      referenceNo,
      staffUserId
    } = req.body

    // Use company ID from environment
    const companyId = process.env.COMPANY_ID
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required. Set COMPANY_ID in environment.' 
      })
    }

    // Validate required fields
    if (!date || !bankId || !clientId || !exchangeId || !amount || !staffUserId) {
      return res.status(400).json({ 
        message: 'Missing required fields: date, bank, client, exchange, amount, staffUserId' 
      })
    }

    // Validate amount
    const withdrawalAmount = parseFloat(amount)
    
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be a positive number' 
      })
    }

    console.log(`💸 Creating withdrawal: ${withdrawalAmount} from bank ${bankId} for client ${clientId}`)

    // Verify all referenced documents exist and belong to the company
    const [bank, client, exchange, staffUser] = await Promise.all([
      Bank.findOne({ _id: bankId, companyId }),
      Client.findOne({ _id: clientId, companyId }),
      Exchange.findOne({ _id: exchangeId, companyId }),
      User.findOne({ _id: staffUserId, companyId, role: 'STAFF', isBlocked: false })
    ])

    if (!bank) {
      return res.status(404).json({ message: 'Bank not found or does not belong to your company' })
    }

    if (!client) {
      return res.status(404).json({ message: 'Client not found or does not belong to your company' })
    }

    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found or does not belong to your company' })
    }

    if (!staffUser) {
      return res.status(404).json({ message: 'Staff user not found or not authorized' })
    }

    // Check if bank has sufficient balance
    if (bank.currentAmount < withdrawalAmount) {
      return res.status(400).json({ 
        message: `Insufficient bank balance. Available: ${bank.currentAmount}, Required: ${withdrawalAmount}` 
      })
    }

    // Check if reference number already exists (if provided)
    if (referenceNo) {
      const existing = await Withdrawal.findOne({ referenceNumber: referenceNo, companyId })
      if (existing) {
        return res.status(400).json({ message: 'Reference number already exists' })
      }
    }

    // Update bank balance (SUBTRACT withdrawal amount - money going OUT of bank)
    const previousBalance = bank.currentAmount
    const newBalance = previousBalance - withdrawalAmount
    bank.currentAmount = newBalance

    // Create the withdrawal record
    const withdrawal = await Withdrawal.create({
      date: new Date(date),
      bankId: new mongoose.Types.ObjectId(bankId),
      referenceNumber: referenceNo || undefined,
      amount: withdrawalAmount,
      clientId: new mongoose.Types.ObjectId(clientId),
      exchangeId: new mongoose.Types.ObjectId(exchangeId),
      note: `Withdrawal for client ${client.name} (${client.clientId})`,
      companyId: new mongoose.Types.ObjectId(companyId),
      createdBy: new mongoose.Types.ObjectId(staffUserId),
      createdByName: staffUser.name,
      isVerified: false,
      isRejected: false
    })

    // Add transaction to bank
    bank.transactions.push({
      type: 'WITHDRAWAL',
      amount: withdrawalAmount,
      previousBalance,
      newBalance,
      performedBy: new mongoose.Types.ObjectId(staffUserId),
      performedByName: staffUser.name,
      note: `Withdrawal for client ${client.name} (${client.clientId})`,
      referenceId: withdrawal._id,
      referenceType: 'Withdrawal',
      createdAt: new Date()
    })

    await bank.save()

    // Populate the created withdrawal for response
    const populatedWithdrawal = await Withdrawal.findById(withdrawal._id)
      .populate('bankId', 'name')
      .populate('clientId', 'name clientId')
      .populate('exchangeId', 'name')
      .populate('createdBy', 'name username')

    console.log(`✅ Withdrawal created successfully: ${withdrawalAmount} (${populatedWithdrawal._id})`)
    console.log(`💳 Bank ${bank.name} balance: ${previousBalance} → ${newBalance}`)

    res.status(201).json({
      success: true,
      message: 'Withdrawal created successfully',
      withdrawal: populatedWithdrawal,
      balanceChanges: {
        bank: {
          name: bank.name,
          previousBalance,
          newBalance,
          change: -withdrawalAmount
        }
      }
    })

  } catch (error) {
    console.error('Error creating withdrawal:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Reference number already exists. Please use a unique reference number.' 
      })
    }
    
    res.status(500).json({ 
      message: 'Error creating withdrawal', 
      error: error.message 
    })
  }
})

// @desc    Get all withdrawals for the configured company
// @route   GET /api/withdrawals
// @access  Public
router.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId || process.env.COMPANY_ID
    const { limit = 50, page = 1, clientId, bankId, exchangeId } = req.query
    
    if (!companyId) {
      return res.status(400).json({ 
        message: 'Company ID is required' 
      })
    }

    // Build query
    const query = { 
      companyId,
      isRejected: false // Exclude rejected transactions from main list
    }
    
    if (clientId) query.clientId = clientId
    if (bankId) query.bankId = bankId
    if (exchangeId) query.exchangeId = exchangeId

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Fetch withdrawals
    const withdrawals = await Withdrawal.find(query)
      .populate('bankId', 'name')
      .populate('clientId', 'name clientId')
      .populate('exchangeId', 'name')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Withdrawal.countDocuments(query)

    console.log(`📊 Found ${withdrawals.length} withdrawals for company ${companyId}`)
    
    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    res.status(500).json({ 
      message: 'Error fetching withdrawals', 
      error: error.message 
    })
  }
})

// @desc    Get single withdrawal by ID
// @route   GET /api/withdrawals/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('bankId', 'name currentAmount')
      .populate('clientId', 'name clientId userId phoneNumber')
      .populate('exchangeId', 'name currentAmount')
      .populate('createdBy', 'name username role')
      .populate('verifiedBy', 'name username role')
      .populate('rejectedBy', 'name username role')

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' })
    }

    console.log(`📄 Fetched withdrawal details: ${withdrawal.amount} (${withdrawal._id})`)
    
    res.json(withdrawal)
  } catch (error) {
    console.error('Error fetching withdrawal:', error)
    res.status(500).json({ 
      message: 'Error fetching withdrawal', 
      error: error.message 
    })
  }
})

export default router