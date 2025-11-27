import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// User Schema - Simple and clean
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  }
}, {
  timestamps: true
})

// Verification Schema
const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claim: {
    type: String,
    required: [true, 'Claim is required'],
    maxLength: [2000, 'Claim cannot exceed 2000 characters']
  },
  claimType: {
    type: String,
    enum: ['text', 'url', 'image'],
    required: true
  },
  verdict: {
    type: String,
    enum: ['true', 'false', 'misleading', 'unknown'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  explanation: {
    type: String,
    maxLength: [5000, 'Explanation cannot exceed 5000 characters']
  },
  reasoning: {
    type: String,
    maxLength: [3000, 'Reasoning cannot exceed 3000 characters']
  },
  sourceCredibility: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  harmIndex: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  evidence: [{
    title: String,
    link: String,
    snippet: String,
    credibility: { type: Number, min: 0, max: 1 },
    relevance: { type: Number, min: 0, max: 1 },
    summary: String
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  flags: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  category: {
    type: String,
    enum: ['science', 'politics', 'health', 'technology', 'finance', 'other'],
    default: 'other'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    processingTime: Number,
    aiModel: String,
    sourceCount: Number
  }
}, {
  timestamps: true
})

// Bookmark Schema
const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Verification',
    required: true
  },
  notes: {
    type: String,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    maxLength: [20, 'Tag cannot exceed 20 characters']
  }]
}, {
  timestamps: true
})

// Indexes for better performance (unique fields already indexed automatically)
verificationSchema.index({ userId: 1, createdAt: -1 })
verificationSchema.index({ isPublic: 1, createdAt: -1 })
verificationSchema.index({ category: 1, createdAt: -1 })
verificationSchema.index({ verdict: 1 })
bookmarkSchema.index({ userId: 1, createdAt: -1 })

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
  } catch (error) {
    throw error
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}



// Clear existing models to ensure schema updates are applied
if (mongoose.models.User) {
  delete mongoose.models.User
}
if (mongoose.models.Verification) {
  delete mongoose.models.Verification  
}
if (mongoose.models.Bookmark) {
  delete mongoose.models.Bookmark
}

// Create models with updated schemas
export const User = mongoose.model('User', userSchema)
export const Verification = mongoose.model('Verification', verificationSchema)
export const Bookmark = mongoose.model('Bookmark', bookmarkSchema)

// Types for TypeScript
export interface IUser extends mongoose.Document {
  name: string
  email: string
  password: string
  comparePassword(candidatePassword: string): Promise<boolean>
}

export interface IVerification extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  claim: string
  claimType: 'text' | 'url' | 'image'
  verdict: 'true' | 'false' | 'misleading' | 'unknown'
  confidence: number
  explanation: string
  reasoning: string
  sourceCredibility: number
  harmIndex: 'low' | 'medium' | 'high' | 'critical'
  evidence: Array<{
    title: string
    link: string
    snippet: string
    credibility: number
    relevance: number
    summary: string
  }>
  isPublic: boolean
  views: number
  bookmarks: mongoose.Types.ObjectId[]
  flags: Array<{
    userId: mongoose.Types.ObjectId
    reason: string
    timestamp: Date
  }>
  category: 'science' | 'politics' | 'health' | 'technology' | 'finance' | 'other'
  metadata: {
    ipAddress: string
    userAgent: string
    processingTime: number
    aiModel: string
    sourceCount: number
  }
}

export interface IBookmark extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  verificationId: mongoose.Types.ObjectId
  notes?: string
  tags: string[]
}