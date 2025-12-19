import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  deviceInfo: {
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    device: String,
    deviceType: String,
    isMobile: Boolean
  },
  ipAddress: {
    type: String
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  userAgent: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

sessionSchema.index({ user: 1 });
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ createdAt: -1 });

sessionSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

sessionSchema.methods.updateLastAccessed = function() {
  this.lastAccessedAt = new Date();
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;