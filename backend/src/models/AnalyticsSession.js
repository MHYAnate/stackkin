// apps/backend/src/models/AnalyticsSession.js
import mongoose from 'mongoose';

const analyticsSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  device: {
    type: {
      type: String,
      enum: ['DESKTOP', 'MOBILE', 'TABLET', 'OTHER'],
      default: 'OTHER',
    },
    brand: String,
    model: String,
    os: String,
    osVersion: String,
    browser: String,
    browserVersion: String,
    screenResolution: String,
    language: String,
  },
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
  endTime: Date,
  pageCount: {
    type: Number,
    default: 0,
  },
  eventCount: {
    type: Number,
    default: 0,
  },
  engaged: {
    type: Boolean,
    default: false,
  },
  engagementScore: {
    type: Number,
    default: 0,
  },
  conversions: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  entryPage: String,
  exitPage: String,
  source: String,
  medium: String,
  campaign: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

analyticsSessionSchema.index({ startTime: -1 });
analyticsSessionSchema.index({ userId: 1, startTime: -1 });

// Virtual for duration
analyticsSessionSchema.virtual('duration').get(function() {
  if (this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return Math.floor((new Date() - this.startTime) / 1000);
});

export default mongoose.model('AnalyticsSession', analyticsSessionSchema);