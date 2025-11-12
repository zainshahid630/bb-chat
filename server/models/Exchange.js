import mongoose from 'mongoose'

const ExchangeTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ADD_FUNDS'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  previousBalance: {
    type: Number,
    required: true,
  },
  newBalance: {
    type: Number,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  performedByName: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false })

const ExchangeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  currentAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  }],
  transactions: [ExchangeTransactionSchema],
}, {
  timestamps: true,
})

// Indexes for better performance
ExchangeSchema.index({ name: 1 })
ExchangeSchema.index({ companyId: 1 })
ExchangeSchema.index({ 'transactions.createdAt': -1 })

export default mongoose.model('Exchange', ExchangeSchema)