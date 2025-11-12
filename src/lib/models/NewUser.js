import mongoose from 'mongoose'

const newUserSchema = new mongoose.Schema({
  client_name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Client name must be at least 2 characters'],
    maxlength: [50, 'Client name cannot exceed 50 characters']
  },
  user_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'User ID must be at least 3 characters'],
    maxlength: [30, 'User ID cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'User ID can only contain letters, numbers, underscores, and hyphens']
  },
  phone_number: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(value) {
        // If phone number is provided, validate it
        if (!value) return true
        const phoneRegex = /^\+?[1-9]\d{1,14}$/
        return phoneRegex.test(value.replace(/\s/g, ''))
      },
      message: 'Please enter a valid phone number'
    }
  },
  exchange: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exchange',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active'],
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
newUserSchema.index({ user_id: 1 }, { unique: true })
newUserSchema.index({ client_name: 1 })
newUserSchema.index({ status: 1 })
newUserSchema.index({ exchange: 1 })
newUserSchema.index({ created_by: 1 })
newUserSchema.index({ created_at: -1 })

// Pre-save middleware to ensure user_id is lowercase and trimmed
newUserSchema.pre('save', function(next) {
  if (this.user_id) {
    this.user_id = this.user_id.toLowerCase().trim()
  }
  next()
})

// Virtual for display name
newUserSchema.virtual('display_name').get(function() {
  return `${this.client_name} (${this.user_id})`
})

// Ensure virtual fields are serialized
newUserSchema.set('toJSON', { virtuals: true })
newUserSchema.set('toObject', { virtuals: true })

export default mongoose.models.NewUser || mongoose.model('NewUser', newUserSchema)