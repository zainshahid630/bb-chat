import mongoose from 'mongoose'

const depositSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Ensure date is not in the past (allow today)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return value >= today
      },
      message: 'Date cannot be in the past'
    }
  },
  bank: {
    type: String,
    required: true,
    enum: ['hbl', 'ubl', 'mcb', 'allied', 'nbp', 'js', 'meezan', 'askari']
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exchange: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exchange',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  bonus_amount: {
    type: Number,
    default: 0,
    min: [0, 'Bonus amount cannot be negative']
  },
  reference_no: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing'],
    default: 'pending'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approved_at: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// Indexes for better performance
depositSchema.index({ client_id: 1, created_at: -1 })
depositSchema.index({ status: 1 })
depositSchema.index({ bank: 1 })
depositSchema.index({ exchange: 1 })
depositSchema.index({ date: 1 })
depositSchema.index({ created_by: 1 })

// Virtual for total amount (amount + bonus)
depositSchema.virtual('total_amount').get(function() {
  return this.amount + (this.bonus_amount || 0)
})

// Ensure virtual fields are serialized
depositSchema.set('toJSON', { virtuals: true })
depositSchema.set('toObject', { virtuals: true })

export default mongoose.models.Deposit || mongoose.model('Deposit', depositSchema)