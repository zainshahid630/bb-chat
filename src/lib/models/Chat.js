import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['deposit', 'withdraw', 'new_id', 'complaint']
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
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
chatSchema.index({ user_id: 1, department: 1 })
chatSchema.index({ status: 1 })
chatSchema.index({ updated_at: -1 })

export default mongoose.models.Chat || mongoose.model('Chat', chatSchema)