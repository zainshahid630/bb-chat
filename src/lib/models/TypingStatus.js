import mongoose from 'mongoose'

const typingStatusSchema = new mongoose.Schema({
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_typing: {
    type: Boolean,
    default: false
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { updatedAt: 'updated_at' }
})

// Compound index for unique chat-user combination
typingStatusSchema.index({ chat_id: 1, user_id: 1 }, { unique: true })

export default mongoose.models.TypingStatus || mongoose.model('TypingStatus', typingStatusSchema)