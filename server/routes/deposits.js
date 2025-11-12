import express from 'express'
import mongoose from 'mongoose'
import Deposit from '../models/Deposit.js'
import Bank from '../models/Bank.js'
import Client from '../models/Client.js'
import Exchange from '../models/Exchange.js'
import User from '../models/User.js'

const router = express.Router()

// @desc    Create a new deposit
// @route   POST /api/deposits
// @access  Public
router.post('/', async (req, res) => {
  try {
    
    const {
      date,
      bank: bankId,
      clientId,
      exchange: exchangeId,
      amount,
      bonusAmount = 0,
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
    const depositAmount = parseFloat(amount)
    const bonus = parseFloat(bonusAmount) || 0
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be a positive number' 
      })
    }

    if (bonus < 0) {
      return res.status(400).json({ 
        message: 'Bonus amount cannot be negative' 
      })
    }

    console.log(`💰 Creating deposit: ${depositAmount} to bank ${bankId} for client ${clientId}`)

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

    // Check if reference number already exists (if provided)
    if (referenceNo) {
      const existing = await Deposit.findOne({ referenceNumber: referenceNo, companyId })
      if (existing) {
        return res.status(400).json({ message: 'Reference number already exists' })
      }
    }

    // Update bank balance (ADD deposit amount - money coming INTO bank)
    const previousBalance = bank.currentAmount
    const newBalance = previousBalance + depositAmount
    bank.currentAmount = newBalance

    // Create the deposit record
    const deposit = await Deposit.create({
      date: new Date(date),
      bankId: new mongoose.Types.ObjectId(bankId),
      referenceNumber: referenceNo || undefined,
      amount: depositAmount,
      bonus: bonus,
      clientId: new mongoose.Types.ObjectId(clientId),
      exchangeId: new mongoose.Types.ObjectId(exchangeId),
      companyId: new mongoose.Types.ObjectId(companyId),
      createdBy: new mongoose.Types.ObjectId(staffUserId),
      createdByName: staffUser.name,
      isVerified: false,
      isRejected: false
    })

    // Add transaction to bank
    bank.transactions.push({
      type: 'DEPOSIT',
      amount: depositAmount,
      previousBalance,
      newBalance,
      performedBy: new mongoose.Types.ObjectId(staffUserId),
      performedByName: staffUser.name,
      note: `Deposit for client ${client.name} (${client.clientId})`,
      referenceId: deposit._id,
      referenceType: 'Deposit',
      createdAt: new Date()
    })

    await bank.save()

    // Populate the created deposit for response
    const populatedDeposit = await Deposit.findById(deposit._id)
      .populate('bankId', 'name')
      .populate('clientId', 'name clientId')
      .populate('exchangeId', 'name')
      .populate('createdBy', 'name username')

    console.log(`✅ Deposit created successfully: ${depositAmount} (${populatedDeposit._id})`)
    console.log(`💳 Bank ${bank.name} balance: ${previousBalance} → ${newBalance}`)

    res.status(201).json({
      success: true,
      message: 'Deposit created successfully',
      deposit: populatedDeposit,
      balanceChanges: {
        bank: {
          name: bank.name,
          previousBalance,
          newBalance,
          change: depositAmount
        }
      }
    })

  } catch (error) {
    console.error('Error creating deposit:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Reference number already exists. Please use a unique reference number.' 
      })
    }
    
    res.status(500).json({ 
      message: 'Error creating deposit', 
      error: error.message 
    })
  }
})

// @desc    Get all deposits for the configured company
// @route   GET /api/deposits
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
    const query = { companyId }
    
    if (clientId) query.clientId = clientId
    if (bankId) query.bankId = bankId
    if (exchangeId) query.exchangeId = exchangeId

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Fetch deposits
    const deposits = await Deposit.find(query)
      .populate('bankId', 'name')
      .populate('clientId', 'name clientId')
      .populate('exchangeId', 'name')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Deposit.countDocuments(query)

    console.log(`📊 Found ${deposits.length} deposits for company ${companyId}`)
    
    res.json({
      deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching deposits:', error)
    res.status(500).json({ 
      message: 'Error fetching deposits', 
      error: error.message 
    })
  }
})

// @desc    Get single deposit by ID
// @route   GET /api/deposits/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id)
      .populate('bankId', 'name currentAmount')
      .populate('clientId', 'name clientId userId phoneNumber')
      .populate('exchangeId', 'name currentAmount')
      .populate('createdBy', 'name username role')
      .populate('verifiedBy', 'name username role')
      .populate('rejectedBy', 'name username role')

    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' })
    }

    console.log(`📄 Fetched deposit details: ${deposit.amount} (${deposit._id})`)
    
    res.json(deposit)
  } catch (error) {
    console.error('Error fetching deposit:', error)
    res.status(500).json({ 
      message: 'Error fetching deposit', 
      error: error.message 
    })
  }
})

export default router