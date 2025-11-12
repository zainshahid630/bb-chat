import mongoose from 'mongoose'

const WithdrawalSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  bankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: true
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  exchangeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exchange',
    required: true
  },
  note: {
    type: String,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedByName: {
    type: String
  },
  verifiedAt: {
    type: Date
  },
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedByName: {
    type: String
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Indexes for better query performance
WithdrawalSchema.index({ companyId: 1, date: -1 })
WithdrawalSchema.index({ clientId: 1, date: -1 })
WithdrawalSchema.index({ bankId: 1, date: -1 })
WithdrawalSchema.index({ exchangeId: 1, date: -1 })
WithdrawalSchema.index({ createdBy: 1, date: -1 })
WithdrawalSchema.index({ isVerified: 1, isRejected: 1 })

// Unique reference number if provided
WithdrawalSchema.index({ referenceNumber: 1 }, { unique: true, sparse: true })

/**
 * In development, mongoose keeps models in mongoose.models across hot-reloads,
 * which can cause an old schema (without new fields) to be used. Delete the
 * cached model in non-production environments so the updated schema is used.
 */
if (process.env.NODE_ENV !== 'production' && mongoose.models.Withdrawal) {
  // Delete the old model so we can recompile with the updated schema during dev/hot-reload
  delete mongoose.models.Withdrawal
}

export default mongoose.model('Withdrawal', WithdrawalSchema)