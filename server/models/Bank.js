import mongoose from 'mongoose'

const BankTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ADD_FUNDS', 'DEPOSIT', 'WITHDRAWAL', 'UPLINE_EXPENSE', 'OTHER_EXPENSE', 'ADMIN_WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT'],
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
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  referenceType: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false })

const BankSchema = new mongoose.Schema({
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
  transactions: [BankTransactionSchema],
}, {
  timestamps: true,
})

// Indexes for better performance
BankSchema.index({ name: 1 })
BankSchema.index({ companyId: 1 })
BankSchema.index({ 'transactions.createdAt': -1 })

export default mongoose.model('Bank', BankSchema)