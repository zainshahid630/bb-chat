import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender_type: {
    type: String,
    enum: ['admin', 'client'],
    required: true
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  file_url: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  delivered_at: {
    type: Date,
    default: null
  },
  read_at: {
    type: Date,
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
messageSchema.index({ chat_id: 1, created_at: 1 })
messageSchema.index({ sender_id: 1 })
messageSchema.index({ status: 1 })

export default mongoose.models.Message || mongoose.model('Message', messageSchema)