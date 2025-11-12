import mongoose from 'mongoose'

const withdrawalSchema = new mongoose.Schema({
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
withdrawalSchema.index({ client_id: 1, created_at: -1 })
withdrawalSchema.index({ status: 1 })
withdrawalSchema.index({ bank: 1 })
withdrawalSchema.index({ exchange: 1 })
withdrawalSchema.index({ date: 1 })
withdrawalSchema.index({ created_by: 1 })

// Ensure virtual fields are serialized
withdrawalSchema.set('toJSON', { virtuals: true })
withdrawalSchema.set('toObject', { virtuals: true })

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema)