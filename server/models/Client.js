import mongoose from 'mongoose'

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  clientId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
    required: false,
  },
  exchangeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exchange',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
}, {
  timestamps: true,
})

// Compound index to ensure unique userId per exchange per company
ClientSchema.index({ userId: 1, exchangeId: 1, companyId: 1 }, { unique: true })

// Index for clientId to ensure uniqueness per company and fast lookups
ClientSchema.index({ clientId: 1, companyId: 1 }, { unique: true })

// Additional indexes for search functionality
ClientSchema.index({ name: 'text', clientId: 'text', userId: 'text' })
ClientSchema.index({ phoneNumber: 1 })

// In development, mongoose keeps models in mongoose.models across hot-reloads
if (process.env.NODE_ENV !== 'production' && mongoose.models.Client) {
  delete mongoose.models.Client
}

export default mongoose.model('Client', ClientSchema)