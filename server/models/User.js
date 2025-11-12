import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'SUPERVISOR'],
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for better query performance
UserSchema.index({ companyId: 1, role: 1 })
UserSchema.index({ username: 1 }, { unique: true }) // Unique index for username
UserSchema.index({ isBlocked: 1 })

/**
 * In development, mongoose keeps models in mongoose.models across hot-reloads,
 * which can cause an old schema (without new fields) to be used. Delete the
 * cached model in non-production environments so the updated schema is used.
 */
if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  // Delete the old model so we can recompile with the updated schema during dev/hot-reload
  delete mongoose.models.User
}

export default mongoose.model('User', UserSchema)